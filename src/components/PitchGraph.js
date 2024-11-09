import React, { useEffect, useRef, useState } from "react";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const PitchGraph = ({
  dimensions,
  realtimeData,
  multiRealDatas,
  referenceData,
  dataPointCount,
  currentTimeIndex,
  songimageProps,
  score,
}) => {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  // 이미지 데이터를 처리하여 src 생성
  useEffect(() => {
    console.log("안녕", songimageProps);
    if (songimageProps?.image?.data) {
      // ArrayBuffer를 Base64 문자열로 변환
      const base64String = arrayBufferToBase64(songimageProps.image.data);
      // 이미지의 MIME 타입을 지정 (예: 'image/png' 또는 'image/jpeg')
      const mimeType = "image/png"; // 필요에 따라 변경
      // 데이터 URL 생성
      const dataUrl = `data:${mimeType};base64,${base64String}`;
      setImageSrc(dataUrl);
    } else {
      setImageSrc(null);
    }
  }, [songimageProps]);

  // Worker와 OffscreenCanvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas._hasTransferred) {
      const offscreen = canvas.transferControlToOffscreen();

      const worker = new Worker(
        new URL("../worker/pitchGraphWorker.js", import.meta.url),
        {
          type: "module",
        }
      );
      console.log("worker create");
      workerRef.current = worker;

      // OffscreenCanvas를 사용하여 워커 초기화
      worker.postMessage({ type: "init", canvas: offscreen, dimensions }, [
        offscreen,
      ]);
      console.log("message on");
      canvas._hasTransferred = true;
    }
  }, []); // 마운트 시 한 번만 실행

  // 워커에 데이터 업데이트
  useEffect(() => {
    const worker = workerRef.current;
    // console.log(realtimeData.slice(0, currentTimeIndex+1));
    if (!worker) {
      console.log("no workers");
      return;
    }

    worker.postMessage({
      type: "timeData",
      realtimeData: realtimeData[currentTimeIndex-1],
      multiRealDatas,
      dataPointCount,
      currentTimeIndex,
      score,
    });
  }, [
    dimensions,
    multiRealDatas,
    dataPointCount,
    currentTimeIndex,
  ]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    worker.postMessage({
      type: "dimensionsData",
      dimensions,
    });
  }, [dimensions]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    worker.postMessage({
      type: "refData",
      referenceData,
    });
  }, [referenceData]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden", // overflow를 숨겨 가장자리 아티팩트 제거
      }}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Background"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 0,
            filter: "blur(10px)", // 블러 효과 추가
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          borderRadius: '0 0 0 0'
        }}
      />
    </div>
  );
};

export default PitchGraph;
