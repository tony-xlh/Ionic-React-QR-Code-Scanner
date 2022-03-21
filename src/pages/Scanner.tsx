import { IonFab, IonFabButton, IonFabList, IonIcon, IonPage } from "@ionic/react";
import { DBR, EnumResolution, ScanResult, TextResult } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useRef, useState } from "react";
import { RouteComponentProps } from "react-router";
import { addOutline, ellipsisHorizontalOutline, flashlightOutline, removeOutline} from 'ionicons/icons';
import QRCodeScanner from "../components/QRCodeScanner";
import "./Scanner.css"

let selectedCam = "";
let currentWidth = 1920;
let currentHeight = 1080;
let scanned = false;

let presetResolutions = [{label:"ask 480P",value:EnumResolution.RESOLUTION_480P},
                         {label:"ask 720P",value:EnumResolution.RESOLUTION_720P},
                         {label:"ask 1080P",value:EnumResolution.RESOLUTION_1080P}]

const Scanner = (props:RouteComponentProps) => {
  const overlayRef = useRef<SVGSVGElement>(null);
  const [initialized,setInitialized] = useState(false);
  const [cameras,setCameras] = useState([] as string[]);
  const [barcodeResults,setBarcodeResults] = useState([] as TextResult[]);
  const [isActive,setIsActive] = useState(false);
  const [torchOn,setTorchOn] = useState(false);
  const [zoom,setZoom] = useState(1.0);
  const [pressedX,setPressedX] = useState<number|undefined>(undefined);
  const [pressedY,setPressedY] = useState<number|undefined>(undefined);
  const [scanRegion,setScanRegion] = useState({left:10,
                                                top:20,
                                                right:90,
                                                bottom:65,
                                                measuredByPercentage:1
                                                });
  const [cameraID,setCameraID] = useState("");
  const [cameraResolution,setCameraResolution] = useState(undefined);
  const [resolutionLabel,setResolutionLabel] = useState("");
  const [viewBox,setViewBox] = useState("0 0 1920 1080");

  const loadCameras = async () => {
    let result = await DBR.getAllCameras();
    if (result.cameras){
      setCameras(result.cameras);
    }
  }

  const updateSelectedCamera = async () => {
    let selectedCameraResult = await DBR.getSelectedCamera();
    console.log(selectedCameraResult);
    if (selectedCameraResult.selectedCamera) {
      selectedCam = selectedCameraResult.selectedCamera;
      setCameraID(selectedCameraResult.selectedCamera);
    }
  }

  const setQRCodeRuntimeSettings = (qrcodeOnly:boolean) => {
    console.log("qrcode only: "+qrcodeOnly);
    if (qrcodeOnly == true) {
      let template = "{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_QR_CODE\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";
      console.log(template);
      DBR.initRuntimeSettingsWithString({template:template})
    } else{
      let template = "{\"ImageParameter\":{\"BarcodeFormatIds\":[\"BF_ALL\"],\"Description\":\"\",\"Name\":\"Settings\"},\"Version\":\"3.0\"}";
      console.log(template);
      DBR.initRuntimeSettingsWithString({template:template})
    }
  }

  useEffect(() => {
    console.log("on mount");
    const state = props.location.state as { continuousScan: boolean; qrcodeOnly: boolean; active: boolean; result?: string};
    console.log(state);
    if (state && state.active != true) {
      return;
    } 
    async function init() {
      let result = await DBR.initialize();
      console.log(result);
      if (result) {
        if (result.success == true) {
          DBR.removeAllListeners();
          DBR.addListener('onFrameRead', async (scanResult:ScanResult) => {
            let results = scanResult["results"];
            if (state.continuousScan) {
              if (scanResult.frameOrientation != undefined && scanResult.deviceOrientation != undefined) {
                for (let index = 0; index < results.length; index++) {
                  handleRotation(results[index], scanResult.deviceOrientation, scanResult.frameOrientation);
                }
                updateViewBox(scanResult.deviceOrientation);
              }
              setBarcodeResults(results);
            }else{
              if (results.length>0 && scanned == false) {
                setIsActive(false);
                scanned = true;
                let result = "";
                for (let index = 0; index < results.length; index++) {
                  const tr:TextResult = results[index];
                  result = result + tr.barcodeFormat + ": " + tr.barcodeText + "\n";
                }
                props.history.replace({ state: {result:result,active:false} });
                props.history.goBack();
              }
            }
          });
          DBR.addListener("onPlayed", (result:{resolution:string}) => {
            console.log("onPlayed");
            console.log(result);
            const resolution: string = result.resolution;
            const width = parseInt(resolution.split("x")[0]);
            const height = parseInt(resolution.split("x")[1]);
            //alert("new res: "+width+"x"+height);
            currentWidth = width;
            currentHeight = height;
            updateViewBox();
            updateSelectedCamera();
            setResolutionLabel(resolution);
          });

          setInitialized(true);
          loadCameras();
          setQRCodeRuntimeSettings(state.qrcodeOnly);
          
        }
      }
    }
    init();
    scanned = false;
    setIsActive(true);
    document.addEventListener('ionBackButton', (ev:any) => {
      ev.detail.register(10, () => {
        setIsActive(false);
        props.history.goBack();
      });
    });
  }, []);
  
  const onCameraSelected = (e: any) => {
    selectedCam = e.target.value;
    setCameraID(selectedCam);
  }

  const onResolutionSelected = (e: any) => {
    setCameraResolution(e.target.value);
  }

  const onClosed = () => {
    setIsActive(false);
    props.history.goBack();
  }

  const getPointsData = (lr:TextResult) => {
    let pointsData = lr.x1+","+lr.y1 + " ";
    pointsData = pointsData+ lr.x2+","+lr.y2 + " ";
    pointsData = pointsData+ lr.x3+","+lr.y3 + " ";
    pointsData = pointsData+ lr.x4+","+lr.y4;
    return pointsData;
  }

  const getPointsDataForFocusHint = (x:number|undefined,y:number|undefined) => {
    if (x != undefined && y != undefined) {
      let lr:any = {};
      x = x*getDisplayWidth();
      y = y*getDisplayHeight();
      x = Math.floor(x);
      y = Math.floor(y);
      let padding = 50;
      lr.x1 = x - padding;
      lr.y1 = y - padding;
      lr.x2 = x + padding;
      lr.y2 = y - padding;
      lr.x3 = x + padding;
      lr.y3 = y + padding;
      lr.x4 = x - padding;
      lr.y4 = y + padding;
      return getPointsData(lr);
    }else{
      return "";
    }
  }

  const handleRotation = (result:any, orientation: string, rotation:number) => {
    let width,height;
    if (orientation == "portrait") {
      width = currentHeight;
      height = currentWidth;
    }else{
      width = currentWidth;
      height = currentHeight;
    }
    const frontCam:boolean = isFront();
    console.log("front cam: "+frontCam);
    for (let i = 1; i < 5; i++) {
      let x = result["x"+i];
      let y = result["y"+i];
      let rotatedX;
      let rotatedY;
      
      switch (rotation) {
        case 0:
          rotatedX = x;
          rotatedY = y;
          if (frontCam == true){ //front cam landscape
            rotatedX = width - rotatedX;
          }
          break;
        case 90:
          rotatedX = width - y;
          rotatedY = x;
          if (frontCam == true){ //front cam portrait
            rotatedY = height - rotatedY;
          }
          break;
        case 180:
          rotatedX = width - x;
          rotatedY = height - y;
          if (frontCam == true){ //front cam landscape
            rotatedX = width - rotatedX;
          }
          break;
        case 270:
          rotatedX = height - y;
          rotatedY = width - x;
          if (frontCam == true){ //front cam portrait
            rotatedY = height - rotatedY;
          }
          break;
        default:
          rotatedX = x;
          rotatedY = y;
      }
      result["x"+i] = rotatedX;
      result["y"+i] = rotatedY;
    }
  }

  const isFront = () => {
    if (selectedCam === "") {
      return false;
    }
    if (selectedCam.toUpperCase().indexOf("BACK") != -1) { //is back cam
      return false;
    }else{
      return true;
    }
  }

  const updateViewBox = (deviceOrientation?:string) => {
    let box:string = "0 0 "+currentWidth+" "+currentHeight;
    if (deviceOrientation && deviceOrientation == "portrait") {
      box = "0 0 "+currentHeight+" "+currentWidth;
    }
    console.log("updated box: "+box);
    setViewBox(box);
  }

  const toggleTorch = () => {
    if (torchOn == false) {
      setTorchOn(true);
    }else{
      setTorchOn(false);
    }
  }

  const onOverlayClicked = (e:any) => {
    if (overlayRef.current) {
      let x = e.clientX / overlayRef.current?.clientWidth;
      let y = e.clientY / overlayRef.current?.clientHeight;
      setPressedX(x);
      setPressedY(y);
      DBR.setFocus({x:x,y:y});
      setTimeout(() => {
        setPressedX(undefined);
        setPressedY(undefined);
      }, 1000);
    }
  }

  const getDisplayWidth = () => {
    return parseInt(viewBox.split(" ")[2]);
  }

  const getDisplayHeight = () => {
    return parseInt(viewBox.split(" ")[3]);
  }

  if (initialized == false) {
    return <div style={{zIndex: 999}}><p>Initializing</p></div>
  }

  return (
    <IonPage style={{ zIndex:999 }}>
      <QRCodeScanner 
        isActive={isActive}
        cameraID={cameraID}
        zoom={zoom}
        resolution={cameraResolution}
        torchOn={torchOn}
        scanRegion={scanRegion}/>

        {isActive &&
        <div>
          <select value={cameraID} className="camera-select controls" onChange={(e) => onCameraSelected(e)}>
            {cameras.map((camera,idx) => (
              <option key={idx} value={camera}>
                {camera}
              </option>
            ))}
          </select>
          <select value={resolutionLabel} className="resolution-select controls" onChange={(e) => onResolutionSelected(e)}>
            <option>
            {"got "+resolutionLabel}
            </option>
            {presetResolutions.map((res,idx) => (
              <option key={idx} value={res.value}>
                {res.label}
              </option>
            ))}
          </select>
          <button className="close-button controls" onClick={onClosed}>Close</button>
          <IonFab vertical="bottom" horizontal="start" slot="fixed">
            <IonFabButton>
              <IonIcon icon={ellipsisHorizontalOutline} />
            </IonFabButton>
            <IonFabList side="top">
              <IonFabButton  onClick={toggleTorch}>
                <IonIcon icon={flashlightOutline} />
              </IonFabButton>
              <IonFabButton onClick={() => {setZoom(1)}}>
                <IonIcon icon={removeOutline} />
              </IonFabButton>
              <IonFabButton onClick={() => {setZoom(2.5)}}>
                <IonIcon icon={addOutline} />
              </IonFabButton>
            </IonFabList>
          </IonFab>
          <svg
            viewBox={viewBox}
            className="overlay"
            ref={overlayRef}
            xmlns="<http://www.w3.org/2000/svg>"
            onClick={(e) => {onOverlayClicked(e)}}
          >
            {barcodeResults.map((tr,idx) => (
                  <polygon key={"poly-"+idx} xmlns="<http://www.w3.org/2000/svg>"
                  points={getPointsData(tr)}
                  className="barcode-polygon"
                  />
              ))}
            {barcodeResults.map((tr,idx) => (
                <text key={"text-"+idx} xmlns="<http://www.w3.org/2000/svg>"
                x={tr.x1}
                y={tr.y1}
                fill="red"
                fontSize={getDisplayWidth()/460*20}
                >{tr.barcodeText}</text>
            ))}
            {(pressedX!=undefined && pressedY!=undefined) &&
              <polygon xmlns="<http://www.w3.org/2000/svg>"
              points={getPointsDataForFocusHint(pressedX,pressedY)}
              className="focus-polygon"
            />
            }
          </svg>
        </div>
        }
      

      
    </IonPage>
  );
  
}
  
export default Scanner;

