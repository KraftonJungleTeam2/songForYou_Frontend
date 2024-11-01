// src/components/PitchGraph.js
import React, { useEffect, useRef } from 'react';

const PitchGraph = ({
  dimensions,
  realtimeData,
  referenceData,
  dataPointCount,
  currentTimeIndex
}) => {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const hasTransferredRef = useRef(false); // 전환 상태를 추적하는 Ref

  // Worker와 OffscreenCanvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas._hasTransferred) { // 전환 상태 확인
      
      const offscreen = canvas.transferControlToOffscreen(); // 캔버스 전환
      hasTransferredRef.current = true; // 플래그 설정하여 재호출 방지

      const worker = new Worker(new URL('../worker/pitchGraphWorker.js', import.meta.url), {
        type: 'module'
      });
      console.log('worker create');
      workerRef.current = worker;

      // OffscreenCanvas를 사용하여 워커 초기화
      worker.postMessage({canvas: offscreen, dimensions }, [offscreen]);
      console.log('messege on');
      canvas._hasTransferred = true;
    }
  }, []); // 마운트 시 한 번만 실행

  // 워커에 데이터 업데이트
  useEffect(() => {
    const worker = workerRef.current;

    if (!worker){
      console.log('no workers');
      return;
    }
    // console.log('In send data', dimensions.width, dimensions.height);
    worker.postMessage({
      dimensions,
      realtimeData,
      referenceData,
      dataPointCount,
      currentTimeIndex,
    });
    
  }, [
    dimensions,
    realtimeData,
    referenceData,
    dataPointCount,
    currentTimeIndex,
  ]);

  return (
    <div style={{ 
      width: dimensions.width, 
      height: dimensions.height,
    }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      />
    </div>
  );
};

export default PitchGraph;
