function template({ title = 'redirect page', url }) {
  return `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=${url}">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
      background-color: #f5f5f5;
    }
    .redirect-message {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
      margin: 0 auto;
    }
    .loading {
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="redirect-message">
    <h2>Redirecting...</h2>
    <p>You will be redirected to the requested page shortly.</p>
    <p class="loading">If you are not redirected automatically, <a href="${url}">click here</a>.</p>
  </div>
  <script>
    // Client-side JavaScript fallback redirect
    setTimeout(function() {
      window.location.href = "${url}";
    }, 100);
  </script>
</body>
</html>
`;
}

process.stdout.write(template({ url: process.argv[2], title: process.argv[3] }));
