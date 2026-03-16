const getYouTubeVideoID = (input: string) => {
  let regex =
    /(?:youtube\.com\/(?:.*[?&]v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  let match = input.match(regex);
  return match ? match[1] : null;
};

export default getYouTubeVideoID;
