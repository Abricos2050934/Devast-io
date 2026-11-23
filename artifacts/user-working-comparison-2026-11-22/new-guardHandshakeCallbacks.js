function guardHandshakeCallbacks(url, success, failure) {
    const request={settled:false};
    return [guardHandshakeCallback(url,success,request),guardHandshakeCallback(url,failure,request)];
  }