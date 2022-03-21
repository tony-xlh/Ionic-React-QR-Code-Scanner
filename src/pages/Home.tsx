import { IonButton, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonToast } from "@ionic/react";
import { TextResult } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import copy from 'copy-to-clipboard';

const Home = (props:RouteComponentProps) => {
  const [continuousScan, setContinuousScan] = useState(false);
  const [present, dismiss] = useIonToast();
  const [QRcodeOnly, setQRcodeOnly] = useState(true);
  const [barcodeResults, setBarcodeResults] = useState([] as TextResult[]);

  useEffect(() => {
    const state = props.location.state as { results?: TextResult[] };
    console.log(state);
    if (state) {
      if (state.results) {
        setBarcodeResults(state.results);
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
    props.history.push("scanner",{continuousScan:continuousScan,qrcodeOnly:QRcodeOnly,active:true})
  }

  const copyBarcode = (text:string) => {
    if (copy(text)){
      present("copied",500);
    }
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
          {barcodeResults.map((tr,idx) => (
            <IonItem key={idx}>
              <IonLabel>{tr.barcodeFormat + ": " + tr.barcodeText}</IonLabel>
              <IonLabel style={{color:"green"}} slot="end" onClick={() =>{copyBarcode(tr.barcodeText)}}>copy</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );

}
  
export default Home;