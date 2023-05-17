function template({ title = 'iframe viewer', url }) {
  return `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    html, body, iframe {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      border: none;
    }
    iframe {
      position: absolute;
    }
  </style>
</head>
<body>
  <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
</body>
</html>
`;
}

process.stdout.write(template({ url: process.argv[2], title: process.argv[3] }));
