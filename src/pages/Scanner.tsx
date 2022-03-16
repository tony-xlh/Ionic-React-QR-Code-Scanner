import { IonPage } from "@ionic/react";
import { DBR, ScanResult, TextResult } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import QRCodeScanner from "../components/QRCodeScanner";
import "./Scanner.css"

let continuousScan = false;
let qrcodeOnly = true;

const Scanner = (props:RouteComponentProps) => {
  const [initialized,setInitialized] = useState(false);
  const [cameras,setCameras] = useState([] as string[]);
  const [barcodeResults,setBarcodeResults] = useState([] as TextResult[]);
  const [isActive,setIsActive] = useState(true);
  const [torchOn,setTorchOn] = useState(false);
  const [cameraID,setCameraID] = useState("");
  const [frameWidth,setFrameWidth] = useState(1920);
  const [frameHeight,setFrameHeight] = useState(1080);
  const state = props.location.state as { continuousScan: boolean; qrcodeOnly: boolean; active: boolean; result?: string};

  const loadCameras = async () => {
    let result = await DBR.getAllCameras();
    if (result.cameras){
      setCameras(result.cameras);
    }
  }

  const setQRCodeRuntimeSettings = () => {
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
    console.log("state changed");
    console.log(state);
    
    if (state) {
      if (state.active != undefined) {
        setIsActive(state.active);
      }
      if (state.continuousScan != undefined) {
        continuousScan = state.continuousScan;
      }
      if (state.qrcodeOnly != undefined && initialized) {
        qrcodeOnly = state.qrcodeOnly;
        setQRCodeRuntimeSettings();
      }
    }
  },[props.location.state]);

  useEffect(() => {
    console.log("on mount");
    console.log("continuousScan: "+continuousScan);
    console.log("qrcodeOnly: "+qrcodeOnly);

    async function init() {
      let result = await DBR.initialize();
      console.log(result);
      if (result) {
        if (result.success == true) {
          setInitialized(true);
          loadCameras();
          setQRCodeRuntimeSettings();
          DBR.addListener('onFrameRead', async (scanResult:ScanResult) => {
            let results = scanResult["results"];
            if (continuousScan) {
              console.log(results);
              if (scanResult.deviceOrientation) {
                if (scanResult.deviceOrientation == "portrait") {
                  if (frameWidth>frameHeight){
                    const height = frameWidth;
                    const width = frameHeight;
                    setFrameHeight(height);
                    setFrameWidth(width);
                    alert(width+"x"+height);
                  }
                }
              }
              setBarcodeResults(results);
            }else{
              if (results.length>0) {
                setIsActive(false);
                let result = "";
                for (let index = 0; index < results.length; index++) {
                  const tr:TextResult = results[index];
                  result = result + tr.barcodeFormat + ": " + tr.barcodeText + "\n";
                }
                props.history.replace({ state: {result:result} });
                props.history.goBack();
              }
            }
          });
          DBR.addListener("onPlayed", (result:{resolution:string}) => {
            alert("on played");
            alert(result.resolution);
            console.log("onPlayed");
            console.log(result);
            let resolution: string = result.resolution;
            setFrameWidth(parseInt(resolution.split("x")[0]));
            setFrameHeight(parseInt(resolution.split("x")[1]));
          });
        }
      }
    }
    init();
    
  }, []);
  
  const onCameraSelected = (e: any) => {
    console.log(e);
    setCameraID(e.target.value);
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

  if (initialized == false) {
    return <p>Initializing</p>
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
              viewBox={"0 0 "+frameWidth+" "+frameHeight}
              className="overlay"
              xmlns="<http://www.w3.org/2000/svg>"
            >
              {barcodeResults.map(tr => (
                    <polygon xmlns="<http://www.w3.org/2000/svg>"
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

