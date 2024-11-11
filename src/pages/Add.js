import React, { useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
import Sidebar from "../components/SideBar";
import { v4 as uuidv4 } from "uuid";
import "../css/Add.css";
import { useSongs } from "../Context/SongContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageTemplate from "../template/PageTemplate";
import { useScreen } from "../Context/ScreenContext";

function Add() {
  const { fetchSongLists } = useSongs();
  const [uploadWithFile, setUploadWithFile] = useState(false); // file과 URL 입력 전환 상태
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(""); // URL 입력 필드 상태 추가
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [genre, setGenre] = useState("jazz");
  const [isWaiting, setIsWaiting] = useState(false);
  const { isMobile } = useScreen();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [language, setSelectedOption] = useState(null);

  const handleLanguage = (event) => {
    setSelectedOption(event.target.value);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleNameChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadWithFile && !file) {
      alert("음악 파일을 선택해주세요");
      return;
    } else if (!uploadWithFile && !url.trim()) {
      alert("음악 유튜브 URL을 입력하세요");
      return;
    }

    if (uploadWithFile && !image) {
      // 파일 업로드 시에만 이미지 검사
      alert("노래 이미지가 필요합니다.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력하세요");
      return;
    }

    if (!description.trim()) {
      alert("");
      return;
    }

    if (!genre.trim()) {
      alert("장르를 입력하세요");
      return;
    }

    if (!language) {
      alert("언어를 선택하세요");
      return;
    }

    setIsWaiting(true);

    // FormData 생성
    const formData = new FormData();
    if (uploadWithFile) {
      formData.append("file", file);
      formData.append("image", image); // 파일 업로드 시에만 이미지 추가
    } else {
      formData.append("youtubeURL", url);
    }
    formData.append("metadata", JSON.stringify({ title, description }));
    formData.append("isPublic", isPublic);
    formData.append("genre", genre);
    formData.append("language", language);

    const token = sessionStorage.getItem("userToken");

    if (!token) {
      console.error("No JWT token found");
      return;
    }

    const requestId = uuidv4();

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_ENDPOINT}/songs/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            "X-Request-ID": requestId,
          },
        }
      );

      if (response.status === 200) {
        toast.success(`배경음악을 추출합니다. 약 10분 소요됩니다.`, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        const eventSource = new EventSource(
          `${process.env.REACT_APP_API_ENDPOINT}/songs/completion?requestId=${requestId}`
        );
        eventSource.onmessage = (event) => {
          const message = event.data;
          const nameMatch = message.match(/name:\s*(.+?)\s*$/);
          const name = nameMatch ? nameMatch[1] : null;

          toast.success(`곡 ${name} 추가가 완료되었습니다.`, {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });

          eventSource.close();
          fetchSongLists();
        };
      }
    } catch (error) {
      console.error("Error adding song:", error);
    }

    // 모든 input 값 초기화
    setFile(null);
    setUrl("");
    setImage(null);
    setTitle("");
    setDescription("");
    setGenre("Rock");
    setIsPublic(true);
    // setUploadWithFile(true);

    // file input 필드 초기화를 위해 DOM 직접 접근
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      input.value = "";
    });

    setIsWaiting(false);
  };

  return (
    <PageTemplate
      isMobile={isMobile}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      current={"add"}
    >

        <div className="add-content-area">
          <div className="component-container add-container">
            <p style={{color: "var(--text-scheme)", fontWeight: "bold"}}>유튜브 URL 또는 파일을 업로드하여 노래를 추가할 수 있습니다.</p>
            <form className="add-form" onSubmit={handleSubmit}>
            
              <label style={{display: "flex"}}>
                파일로 업로드하기:
                <input
                  type="checkbox"
                  checked={uploadWithFile}
                  onChange={(e) => setUploadWithFile(e.target.checked)}
                  style={{width: "20%"}}
                />
              </label>
              {uploadWithFile ? (
                <>
                  <label>
                    노래 파일:
                    <input type="file" onChange={handleFileChange} required />
                  </label>
                </>
              ) : (
                <label>
                  유튜브 URL:
                  <input
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    required
                  />
                </label>
              )}
              <label>
                노래 이미지:
                <input
                  type="file"
                  onChange={handleImageChange}
                  disabled={!uploadWithFile}
                  required
                />
              </label>
              <label>
                제목:
                <input
                  type="text"
                  value={title}
                  onChange={handleNameChange}
                  required
                />
              </label>
              <label>
                가수:
                <input
                  type="text"
                  value={description}
                  onChange={handleDescriptionChange}
                  required
                />
              </label>
              <label  style={{display: "flex"}}>
                공개 여부:
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  required
                  style={{width: "20%"}}
                />
              </label>
              <label>
                장르:
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                />
              </label>
              <label>언어:</label>
              <div style={{ display: "flex", justifyContent: "space-around"}}>
                <label style={{ textAlign: "center", flexDirection: "column"}}>
                  <input
                    type="radio"
                    value="ko"
                    checked={language === "ko"}
                    onChange={handleLanguage}
                  />
                  한국어
                </label>

                <label style={{ textAlign: "center", flexDirection: "column" }}>
                  <input
                    type="radio"
                    value="en"
                    checked={language === "en"}
                    onChange={handleLanguage}
                  />
                  영어
                </label>

                <label style={{ textAlign: "center", flexDirection: "column" }}>
                  <input
                    type="radio"
                    value="others"
                    checked={language === "others"}
                    onChange={handleLanguage}
                  />
                  그 외
                </label>
              </div>
              <button
                className={`add-button is-highlight button ${isWaiting ? "is-loading" : ""}`}
                disabled={isWaiting}
                type="submit"
                style={{marginTop: '2em'}}
              >
                추가하기
              </button>
            </form>
          </div>
        </div>
    
    </PageTemplate>
  );
}

export default Add;
