import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";

function MultiPlay() {
    const [message, setMessage] = useState("No message received");

    useEffect(() => {
        // WebSocket 연결 설정
        const socket = new WebSocket("ws://your-websocket-server-url");

        // WebSocket 연결 성공 시 실행
        socket.onopen = () => {
            console.log("WebSocket connection established.");
            socket.send("Hello Server!"); // 서버로 메시지 전송
        };

        // WebSocket 메시지 수신 시 실행
        socket.onmessage = (event) => {
            console.log("Message received from server:", event.data);
            setMessage(event.data); // 수신된 메시지를 상태에 저장
        };

        // WebSocket 연결 오류 발생 시 실행
        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // WebSocket 연결 종료 시 실행
        socket.onclose = () => {
            console.log("WebSocket connection closed.");
        };

        // 컴포넌트 언마운트 시 WebSocket 연결 해제
        return () => {
            socket.close();
        };
    }, []);

    return (
        <div className="multiPlay-page">
            <TopBar />
            <h1>Hello</h1>
            <p>Server message: {message}</p>
        </div>
    );
}

export default MultiPlay;
