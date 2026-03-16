const handleFileResponse = (files: any) => {
  return files.map(({ _doc }: { _doc: any }) => ({
    ..._doc,
    url: `${process.env.BASE_URL}/tools/access-file/${_doc._id}`,
  }));
};

export default handleFileResponse;
