import React, { useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Sidebar from '../components/SideBar';

function Add() {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
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
    setName(e.target.value);
  };
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file); // 파일 추가
    formData.append('image', image); // 이미지 추가
    formData.append('metadata', JSON.stringify({ name, description }));
    formData.append('isPublic', isPublic); // 공개 여부 추가
    formData.append('genre', genre); // 장르 추가
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    try {
      const token = sessionStorage.getItem('userToken');
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      // API 요청
      const response = await axios.put('http://localhost:5000/api/songs/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Song added successfully:', response.data);
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
              <input type='text' value={name} onChange={handleNameChange} />
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
