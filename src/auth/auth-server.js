// ABOUTME: HTTP server for handling Spotify OAuth callback
// ABOUTME: Manages temporary server lifecycle for authentication flow

const http = require('http');
const url = require('url');

class AuthServer {
  constructor() {
    this.server = null;
    this.port = 8888;
    this.host = '127.0.0.1';
  }

  start(resolvePromise, rejectPromise) {
    this.server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/callback') {
        const authCode = parsedUrl.query.code;
        const error = parsedUrl.query.error;

        if (error) {
          console.error('Spotify Authentication Error:', error);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Failed</h1><p>You can close this window.</p>');
          if (rejectPromise) rejectPromise(new Error('Spotify authentication failed: ' + error));
          return;
        }

        if (authCode) {
          try {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to the app.</p>');
            
            if (resolvePromise) resolvePromise(authCode);
          } catch (err) {
            console.error('Error in auth callback:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Error processing authentication</h1><p>Please try again.</p>');
            if (rejectPromise) rejectPromise(err);
          } finally {
            this.close();
          }
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.server.listen(this.port, this.host, () => {
      console.log(`Temporary server for Spotify auth callback listening on http://${this.host}:${this.port}`);
    });

    this.server.on('error', (err) => {
      console.error("Auth server error:", err);
      if (rejectPromise) rejectPromise(err);
    });
  }

  close() {
    if (this.server && this.server.listening) {
      this.server.close(() => {
        console.log('Auth callback server closed.');
      });
    }
  }

  isRunning() {
    return this.server && this.server.listening;
  }
}

module.exports = new AuthServer();