const fetch = global.fetch;
(async () => {
  const login = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kongu.edu', password: 'Admin@123' }),
  });
  const loginData = await login.json();
  console.log('login', login.status, loginData);
  const resources = await fetch('http://127.0.0.1:5000/api/resources/mine', {
    headers: { Authorization: 'Bearer ' + loginData.token },
  });
  const resData = await resources.json();
  console.log('mine', resources.status, resData);
})();
