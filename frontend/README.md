# SignFlow API

Backend API for the SignFlow Digital Signature Application.

## Features

- **User Authentication**: Registration, login, password reset with JWT tokens
- **Document Management**: Upload, view, download, and delete PDF documents
- **Digital Signatures**: Add and manage signature fields on documents
- **Email Notifications**: Send signing requests and password reset emails
- **Security**: Rate limiting, input validation, file type restrictions
- **File Handling**: Secure PDF upload with size limits

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Gmail account for email functionality (or configure another email service)

### Installation

1. **Clone and install dependencies:**
\`\`\`bash
git clone <repository-url>
cd signflow-api
npm install
\`\`\`

2. **Environment Setup:**
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

3. **Start the server:**
\`\`\`bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
\`\`\`

The API will be available at `http://localhost:5000`

### Email Configuration

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use your Gmail address and App Password in the `.env` file

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgotpassword` - Request password reset
- `GET /api/auth/resetpassword/:token` - Validate reset token
- `PUT /api/auth/resetpassword/:token` - Reset password
- `GET /api/auth/profile` - Get user profile (requires auth)

### Documents
- `POST /api/documents/upload` - Upload document (requires auth)
- `GET /api/documents` - Get user documents (requires auth)
- `GET /api/documents/:id` - Get single document (requires auth)
- `POST /api/documents/send-for-signing` - Send document for signing (requires auth)
- `POST /api/documents/:id/signatures` - Add signature to document (requires auth)
- `GET /api/documents/:id/download` - Download document (requires auth)
- `DELETE /api/documents/:id` - Delete document (requires auth)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (requires auth)

### Utility
- `GET /api/health` - Health check

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes, 5 auth attempts per 15 minutes
- **Input Validation**: Email format, password strength, file type validation
- **File Security**: PDF-only uploads, 10MB size limit, secure file storage
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers middleware

## File Upload

- **Supported formats**: PDF only
- **Maximum size**: 10MB
- **Storage**: Local filesystem (uploads/ directory)
- **Security**: File type validation, unique filenames

## Data Storage

Currently uses in-memory storage for development. For production, integrate with:
- **MongoDB** for document-based storage
- **PostgreSQL** for relational data
- **Cloud storage** (AWS S3, Google Cloud) for file storage

## Error Handling

The API returns consistent error responses:
\`\`\`json
{
  "success": false,
  "message": "Error description"
}
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
\`\`\`

## Production Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Replace in-memory storage with persistent database
3. **File Storage**: Use cloud storage for uploaded files
4. **Email Service**: Configure production email service
5. **Security**: Update JWT secret, enable HTTPS
6. **Monitoring**: Add logging and monitoring solutions

## API Testing

Use tools like Postman, Insomnia, or curl to test the API endpoints.

Example registration request:
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
