import React, { useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import { v4 as uuidv4 } from 'uuid';
import '../css/Add.css';
import { useSongs } from '../Context/SongContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Add() {
  const { fetchSongLists } = useSongs();
  const [ischeckBox, setischeckBox] = useState(false); // file과 URL 입력 전환 상태
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(''); // URL 입력 필드 상태 추가
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [genre, setGenre] = useState('jazz');
  const [isWaiting, setIsWaiting] = useState(false);

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

    if (ischeckBox && !file) {
      alert('음악을 선택해주세요');
      return;
    } else if (!ischeckBox && !url.trim()) {
      alert('음악 유튜브 URL을 입력하세요');
      return;
    }

    if (ischeckBox && !image) {  // 파일 업로드 시에만 이미지 검사
      alert('노래 이미지가 필요합니다.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력하세요');
      return;
    }

    if (!description.trim()) {
      alert('');
      return;
    }

    if (!genre.trim()) {
      alert('장르를 입력하세요');
      return;
    }

    if (!language) {
      alert("언어를 선택하세요");
      return;
    }

    setIsWaiting(true);

    // FormData 생성
    const formData = new FormData();
    if (ischeckBox) {
      formData.append('file', file);
      formData.append('image', image);  // 파일 업로드 시에만 이미지 추가
    } else {
      formData.append('youtubeURL', url);
    }
    formData.append('metadata', JSON.stringify({ title, description }));
    formData.append('isPublic', isPublic);
    formData.append('genre', genre);
    formData.append('language', language);

    const token = sessionStorage.getItem('userToken');

    if (!token) {
      console.error('No JWT token found');
      return;
    }

    const requestId = uuidv4();

    try {
      const response = await axios.put(`${process.env.REACT_APP_API_ENDPOINT}/songs/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-Request-ID': requestId,
        },
      });

      // 모든 input 값 초기화
      setFile(null);
      setUrl('');
      setImage(null);
      setTitle('');
      setDescription('');
      setGenre('Rock');
      setIsPublic(true);
      setischeckBox(true);

      // file input 필드 초기화를 위해 DOM 직접 접근
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        input.value = '';
      });

      if (response.status === 200) {
        toast.success(`배경음악을 추출합니다. 약 10분 소요됩니다.`, {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        const eventSource = new EventSource(`${process.env.REACT_APP_API_ENDPOINT}/songs/completion?requestId=${requestId}`);
        eventSource.onmessage = (event) => {
          const message = event.data;
          const nameMatch = message.match(/name:\s*(.+?)\s*$/);
          const name = nameMatch ? nameMatch[1] : null;

          toast.success(`곡 ${name} 추가가 완료되었습니다.`, {
            position: 'bottom-right',
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
      console.error('Error adding song:', error);
    }
    setIsWaiting(false);
  };

  return (
    <div className='single-page'>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <TopBar />
        <div className='add-content-area'>
          <div className='component-container' style={{padding: '0rem 1.5rem', overflow: 'auto'}}>
            <form onSubmit={handleSubmit}>
              <label>
                파일로 업로드하기:
                <input type='checkbox' checked={ischeckBox} onChange={(e) => setischeckBox(e.target.checked)} />
              </label>
              <br />
              {ischeckBox ? (
                <>
                  <label>
                    노래 파일:
                    <input type='file' onChange={handleFileChange} />
                  </label>
                </>
              ) : (
                <label>
                  유튜브 URL:
                  <input type='text' value={url} onChange={handleUrlChange} />
                </label>
              )}
              <br />
              <label>
                노래 이미지:
                <input type='file' onChange={handleImageChange} disabled={!ischeckBox} />
              </label>
              <br />
              <label>
                제목
                <input type='text' value={title} onChange={handleNameChange} />
              </label>
              <br />
              <label>
                설명
                <input type='text' value={description} onChange={handleDescriptionChange} />
              </label>
              <br />
              <label>
                공개 여부:
                <input type='checkbox' checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              </label>
              <br />
              <label>
                장르:
                <input type='text' value={genre} onChange={(e) => setGenre(e.target.value)} />
              </label>
              <br />
              <label>
                언어:
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <label style={{ textAlign: 'center' }}>
                  <input
                    type="radio"
                    value="ko"
                    checked={language === 'ko'}
                    onChange={handleLanguage}
                  />
                  한국어
                </label>

                <label style={{ textAlign: 'center' }}>
                  <input
                    type="radio"
                    value="en"
                    checked={language === 'en'}
                    onChange={handleLanguage}
                  />
                  영어
                </label>

                <label style={{ textAlign: 'center' }}>
                  <input
                    type="radio"
                    value="others"
                    checked={language === 'others'}
                    onChange={handleLanguage}
                  />
                  그 외
                </label>
              </div>
              <br />
              <button className={`button ${isWaiting ? 'is-loading' : ''}`} disabled={isWaiting} type='submit'>추가하기</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Add;