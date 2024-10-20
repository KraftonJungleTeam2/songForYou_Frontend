async function fetchSongData() {
    const response = await fetch('/your-music-endpoint');
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}
