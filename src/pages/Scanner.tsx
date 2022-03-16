import { IonPage } from "@ionic/react";
import { DBR } from "capacitor-plugin-dynamsoft-barcode-reader";
import { useEffect, useState } from "react";
import QRCodeScanner from "../components/QRCodeScanner";


const Scanner: React.FC = () => {
  let [initialized,setInitialized] = useState(false);
  let [active,setActive] = useState(false);
  let [torchOn,setTorchOn] = useState(false);

  useEffect(() => {
    async function init() {
      let result = await DBR.initialize();
      console.log(result);
      if (result) {
        if (result.success == true) {
          setInitialized(true);
        }
      }
    }
    init();
  }, []);
  
  return (
    <IonPage>
      {initialized ? 
      <QRCodeScanner 
        active={active}
        torchOn={torchOn}/>:
      <p>Initializing</p>}

    </IonPage>
  );
  
}
  
export default Scanner;

