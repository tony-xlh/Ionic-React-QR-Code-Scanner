import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './QRCodeScanner.css';
import { DBR, TextResult } from 'capacitor-plugin-dynamsoft-barcode-reader';
import { CameraPreview } from 'capacitor-plugin-camera';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

export interface QRCodeScannerProps {
  torchOn?: boolean;
  onScanned?: (results:TextResult[]) => void;
  onPlayed?: (result:{orientation:"LANDSCAPE"|"PORTRAIT",resolution:string}) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = (props:QRCodeScannerProps) => {
  const container:MutableRefObject<HTMLDivElement|null> = useRef(null);
  const decoding = useRef(false);
  const interval = useRef<any>();
  const onPlayedListener = useRef<PluginListenerHandle|undefined>();
  const [initialized,setInitialized] = useState(false);
  useEffect(() => {
    const init = async () => {
      if (container.current && Capacitor.isNativePlatform() === false) {
        await CameraPreview.setElement(container.current);
      }
      await CameraPreview.initialize();
      await CameraPreview.requestCameraPermission();
      await DBR.initialize();
      console.log("QRCodeScanner mounted");
      if (onPlayedListener.current) {
        onPlayedListener.current.remove();
      }
      onPlayedListener.current = await CameraPreview.addListener("onPlayed", async () => {
        startDecoding();
        const orientation = (await CameraPreview.getOrientation()).orientation;
        const resolution = (await CameraPreview.getResolution()).resolution;
        if (props.onPlayed) {
          props.onPlayed({orientation:orientation,resolution:resolution});
        }
      });
      await CameraPreview.startCamera();
      setInitialized(true);
    }
    init();
    return ()=>{
      console.log("unmount and stop scan");
      stopDecoding();
      CameraPreview.stopCamera();
    }
  }, []);

  const startDecoding = () => {
    stopDecoding();
    interval.current = setInterval(captureAndDecode,100);
  }
  
  const stopDecoding = () => {
    clearInterval(interval.current);
  }
  
  const captureAndDecode = async () => {
    if (decoding.current === true) {
      return;
    }
    let results = [];
    let dataURL;
    decoding.current = true;
    try {
      if (Capacitor.isNativePlatform()) {
        await CameraPreview.saveFrame();
        results = (await DBR.decodeBitmap({})).results;
      }else{
        let frame = await CameraPreview.takeSnapshot({quality:50});
        dataURL = "data:image/jpeg;base64,"+frame.base64;
        results = await readDataURL(dataURL);
      }
      if (props.onScanned) {
        props.onScanned(results);
      }
    } catch (error) {
      console.log(error);
    }
    decoding.current = false;
  }

  const readDataURL = async (dataURL:string) => {
    let response = await DBR.decode({source:dataURL});
    let results = response.results;
    return results;
  }

  useEffect(() => {
    if (initialized) {
      if (props.torchOn === true) {
        CameraPreview.toggleTorch({on:true});
      }else{
        CameraPreview.toggleTorch({on:false});
      }
    }
  }, [props.torchOn]);
  
  return (
    <>
      {!initialized && (
        <div>Initializing...</div>
      )}
      <div ref={container}>
        <div className="dce-video-container"></div>
      </div>
    </>
  );
};

export default QRCodeScanner;
