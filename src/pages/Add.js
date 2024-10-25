import React, { useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';
import { v4 as uuidv4 } from 'uuid';
import '../css/Add.css';

import { SongProvider, useSongs } from '../Context/SongContext';
function Add() {
  const { fetchSongLists } = useSongs();
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [genre, setGenre] = useState('jazz');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // 첫 번째 파일을 선택
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

    if (!file) {
      alert('Please upload a song file.');
      return;
    }

    if (!image) {
      alert('Please upload a song image.');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a song name.');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description.');
      return;
    }

    if (!genre.trim()) {
      alert('Please enter a genre.');
      return;
    }
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file); // 파일 추가
    formData.append('image', image); // 이미지 추가
    formData.append('metadata', JSON.stringify({ title, description }));
    formData.append('isPublic', isPublic); // 공개 여부 추가
    formData.append('genre', genre); // 장르 추가

    const token = sessionStorage.getItem('userToken');

    if (!token) {
      console.error('No JWT token found');
      return;
    }

    const requestId = uuidv4();

    try {
      // API 요청
      const response = await axios.put('http://localhost:5000/api/songs/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-Request-ID': requestId,
        },
      });
      console.log(response.data);

      const eventSource = new EventSource(`http://localhost:5000/api/songs/completion?requestId=${requestId}`);

      eventSource.onmessage = (event) => {
        console.log('서버로부터 받은 메시지:', event.data);
        // 응답을 받은 후 연결 종료
        eventSource.close(); // 연결 종료
        fetchSongLists();
      };
    } catch (error) {
      console.error('Error adding song:', error);
    }
  };

  return (
    <div className='single-page'>
      <Sidebar />
      <div className='main-content'>
        <TopBar />
        <div className='content-area'>
          <form onSubmit={handleSubmit}>
            <label>
              Song File:
              <input type='file' onChange={handleFileChange} />
            </label>
            <br />
            <label>
              Song Image:
              <input type='file' onChange={handleImageChange} />
            </label>
            <br />
            <label>
              Name
              <input type='text' value={title} onChange={handleNameChange} />
            </label>
            <br />{' '}
            <label>
              Description
              <input type='text' value={description} onChange={handleDescriptionChange} />
            </label>
            <br />
            <label>
              Public:
              <input type='checkbox' checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            </label>
            <br />
            <label>
              Genre:
              <input type='text' value={genre} onChange={(e) => setGenre(e.target.value)} />
            </label>
            <br />
            <button type='submit'>Add Song</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Add;
