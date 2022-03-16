import { IonButton, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";

const Home = (props:RouteComponentProps) => {
  const [continuousScan, setContinuousScan] = useState(false);
  const [QRcodeOnly, setQRcodeOnly] = useState(true);
  const [result, setResult] = useState("");

  useEffect(() => {
    const state = props.location.state as { result?: string };
    console.log(state);
    if (state) {
      if (state.result) {
        let result = state.result;
        setResult(result);
        props.history.replace({ state: {} });
      }
    }
  }, [props.location.state]);
  
  const handleOption = (e: any) => {
    let value = e.detail.value;
    let checked = e.detail.checked;
    if (value == "Continuous Scan") {
      setContinuousScan(checked)
    } else if (value == "Scan QR Code Only") {
      setQRcodeOnly(checked);
    }
  }

  const startScan = () => {
    props.history.push("Scanner",{continuousScan:continuousScan,qrcodeOnly:QRcodeOnly,active:true})
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QR Code Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonButton expand="full" onClick={startScan}>Start Scanning</IonButton>
        <IonList>
          <IonItem>
            <IonLabel>Continuous Scan</IonLabel>
            <IonCheckbox slot="end" value="Continuous Scan" checked={continuousScan} onIonChange={(e) => handleOption(e)}/>
          </IonItem>
          <IonItem>
            <IonLabel>Scan QR Code Only</IonLabel>
            <IonCheckbox slot="end" value="Scan QR Code Only" checked={QRcodeOnly} onIonChange={(e) => handleOption(e)}/>
          </IonItem>
        </IonList>
        <pre>{result}</pre>
       
        
      </IonContent>
    </IonPage>
  );

}
  
export default Home;