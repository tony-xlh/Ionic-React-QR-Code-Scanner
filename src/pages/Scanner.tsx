import { IonPage } from "@ionic/react";
import { DBR, TextResult } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import QRCodeScanner from "../components/QRCodeScanner";
import "./Scanner.css"

let continuousScan = false;
let qrcodeOnly = true;

const Scanner = (props:RouteComponentProps) => {
  const [initialized,setInitialized] = useState(false);
  const [cameras,setCameras] = useState([] as string[]);
  const [isActive,setIsActive] = useState(true);
  const [torchOn,setTorchOn] = useState(false);
  const [cameraID,setCameraID] = useState("");
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
      if (state.qrcodeOnly != undefined) {
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
          DBR.addListener('onFrameRead', async (retObj) => {
            let results = retObj["results"];
            if (continuousScan) {
              console.log(results);
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
        </div>
        }
      

      
    </IonPage>
  );
  
}
  
export default Scanner;

