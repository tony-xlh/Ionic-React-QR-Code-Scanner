import { IonPage } from "@ionic/react";
import { DBR, EnumResolution, ScanResult, TextResult } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import QRCodeScanner from "../components/QRCodeScanner";
import "./Scanner.css"

let selectedCam = "";
let currentWidth = 1920;
let currentHeight = 1080;
let scanned = false;

const Scanner = (props:RouteComponentProps) => {
  const [initialized,setInitialized] = useState(false);
  const [cameras,setCameras] = useState([] as string[]);
  const [barcodeResults,setBarcodeResults] = useState([] as TextResult[]);
  const [isActive,setIsActive] = useState(false);
  const [torchOn,setTorchOn] = useState(false);
  const [cameraID,setCameraID] = useState("");
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

  if (initialized == false) {
    return <div style={{zIndex: 999}}><p>Initializing</p></div>
  }

  return (
    <IonPage style={{ zIndex:999 }}>
      <QRCodeScanner 
        isActive={isActive}
        cameraID={cameraID}
        torchOn={torchOn}/>

        {isActive &&
        <div>
          <select value={cameraID} className="camera-select controls" onChange={(e) => onCameraSelected(e)}>
            {cameras.map((camera,idx) => (
              <option key={idx} value={camera}>
                {camera}
              </option>
            ))}
            </select>
            <button className="close-button controls" onClick={onClosed}>Close</button>
            <svg
              viewBox={viewBox}
              className="overlay"
              xmlns="<http://www.w3.org/2000/svg>"
            >
              {barcodeResults.map((tr,idx) => (
                    <polygon key={"poly-"+idx} xmlns="<http://www.w3.org/2000/svg>"
                    points={getPointsData(tr)}
                    className="barcode-polygon"
                    />
                ))}
            </svg>
        </div>
        }
      

      
    </IonPage>
  );
  
}
  
export default Scanner;

