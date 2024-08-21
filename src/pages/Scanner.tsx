import { IonContent, IonFab, IonFabButton, IonFabList, IonIcon, IonPage } from '@ionic/react';
import './Scanner.css';
import QRCodeScanner from '../components/QRCodeScanner';
import { RouteComponentProps } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { ellipsisHorizontalOutline, flashlightOutline, closeOutline} from 'ionicons/icons';
import { TextResult } from 'capacitor-plugin-dynamsoft-barcode-reader';


const Scanner = (props:RouteComponentProps)  => {
  const [viewBox,setViewBox] = useState("0 0 720 1280");
  const continuousScan = useRef(false);
  const scanned = useRef(false);
  const [torchOn,setTorchOn] = useState(false);
  const [barcodeResults,setBarcodeResults] = useState([] as TextResult[]);
  const ionBackground = useRef("");
  
  useEffect(() => {
    ionBackground.current = document.documentElement.style.getPropertyValue('--ion-background-color');
    return () => {
      document.documentElement.style.setProperty('--ion-background-color', ionBackground.current);
    }
  }, []);

  useEffect(() => {
    const state = props.location.state as { continuousScan?: boolean };
    if (state) {
      if (state.continuousScan) {
        continuousScan.current = state.continuousScan;
      }
    }
  }, [props.location.state]);

  const toggleTorch = () => {
    if (torchOn == false) {
      setTorchOn(true);
    }else{
      setTorchOn(false);
    }
  }
  
  const goBack = () => {
    document.documentElement.style.setProperty('--ion-background-color', ionBackground.current);
    props.history.goBack();
  }

  const onPlayed = (result:{orientation:"LANDSCAPE"|"PORTRAIT",resolution:string}) => {
    console.log(result);
    document.documentElement.style.setProperty('--ion-background-color', 'transparent');
    let width = parseInt(result.resolution.split("x")[0]);
    let height = parseInt(result.resolution.split("x")[1]);
    let box:string;
    if (result.orientation === "PORTRAIT") {
      box = "0 0 "+height+" "+width;
    }else{
      box = "0 0 "+width+" "+height;
    }
    setViewBox(box);
  }

  const onScanned = (results:TextResult[]) => {
    console.log(results);
    if (continuousScan.current) {
      setBarcodeResults(results);
    }else{
      if (results.length>0 && scanned.current === false) {
        document.documentElement.style.setProperty('--ion-background-color', ionBackground.current);
        scanned.current = true;
        props.history.replace({ state: {results:results} });
        props.history.goBack();
      }
    }
    
  }

  const getPointsData = (lr:TextResult) => {
    let pointsData = lr.x1+","+lr.y1 + " ";
    pointsData = pointsData+ lr.x2+","+lr.y2 + " ";
    pointsData = pointsData+ lr.x3+","+lr.y3 + " ";
    pointsData = pointsData+ lr.x4+","+lr.y4;
    return pointsData;
  }

  const getViewBoxWidth = () => {
    return parseInt(viewBox.split(" ")[2]);
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <QRCodeScanner 
          torchOn={torchOn}
          onPlayed={onPlayed}
          onScanned={onScanned}
        />
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid slice"
          className="overlay"
          xmlns="<http://www.w3.org/2000/svg>"
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
            fontSize={getViewBoxWidth()/460*10}
            >{tr.barcodeText}</text>
          ))}
        </svg>
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton>
            <IonIcon icon={ellipsisHorizontalOutline} />
          </IonFabButton>
          <IonFabList side="top">
            <IonFabButton onClick={toggleTorch}>
              <IonIcon icon={flashlightOutline} />
            </IonFabButton>
            <IonFabButton onClick={() => {goBack()}}>
              <IonIcon icon={closeOutline} />
            </IonFabButton>
          </IonFabList>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Scanner;
