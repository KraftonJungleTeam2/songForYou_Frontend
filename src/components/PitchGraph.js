// src/components/PitchGraph.js
import React, { useEffect, useRef } from 'react';

const PitchGraph = ({
  dimensions,
  realtimeData,
  referenceData,
  dataPointCount,
  currentTimeIndex,
  songState,
}) => {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Worker 초기화를 한 번만 수행
  useEffect(() => {
    let cleanup = () => {};

    const initializeWorker = async () => {
      if (hasInitializedRef.current) return;

      try {
        const worker = new Worker(new URL('../worker/pitchGraphWorker.js', import.meta.url), {
          type: 'module'
        });

        worker.onerror = (error) => {
          console.error('Worker error:', error);
        };

        worker.onmessage = (event) => {
          if (event.data.type === 'error') {
            console.error('Worker reported error:', event.data.message);
          }
        };

        workerRef.current = worker;
        hasInitializedRef.current = true;

        cleanup = () => {
          worker.terminate();
          workerRef.current = null;
        };
      } catch (error) {
        console.error('Error creating worker:', error);
      }
    };

    initializeWorker();
    return () => cleanup();
  }, []); // 워커는 한 번만 초기화

  // 캔버스 초기화 및 OffscreenCanvas 전송
  useEffect(() => {
    const canvas = canvasRef.current;
    const worker = workerRef.current;

    if (!canvas || !worker || !dimensions.width || !dimensions.height) return;

    try {
      if (canvas.transferControlToOffscreen && !canvas._hasTransferred) {
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage(
          {
            type: 'init',
            canvas: offscreen,
            dimensions,
          },
          [offscreen]
        );
        // 전송 완료 표시
        canvas._hasTransferred = true;
      }
    } catch (error) {
      console.error('Error transferring canvas control:', error);
    }
  }, [dimensions]); // dimensions가 변경될 때만 실행

  // 데이터 업데이트
  useEffect(() => {
    const worker = workerRef.current;
    const canvas = canvasRef.current;

    if (!worker || !canvas || !canvas._hasTransferred) return;

    try {
      worker.postMessage(
        {
          type: 'updateData',
          dimensions,
          realtimeData,
          referenceData,
          dataPointCount,
          currentTimeIndex,
          songStateImageData: songState?.image?.data || null, // 이미지 데이터 전달
        },
        songState?.image?.data ? [songState.image.data.buffer] : [] // Transferable Objects 사용
      );
    } catch (error) {
      console.error('Error sending data to worker:', error);
    }
  }, [
    dimensions,
    realtimeData,
    referenceData,
    dataPointCount,
    currentTimeIndex,
    songState?.image?.data, // 이미지 데이터 변경 시 업데이트
  ]);

  return (
    <div style={{ 
      width: dimensions.width, 
      height: dimensions.height,
      position: 'relative'
    }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default PitchGraph; 
