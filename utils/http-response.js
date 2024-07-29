const default_msg = 'Query run successfully';
module.exports = {
  send_json: (res, status , msg, code , data=[]) => {
    const httpRes = {
      status,
      msg: msg ?? default_msg,
      data
    };
    return res.status(code).json(httpRes);
  },
};
