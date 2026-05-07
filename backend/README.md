# Alta Daily Backend

AI-powered fashion wardrobe management system built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Authentication**: JWT-based auth with registration/login
- **Wardrobe Management**: CRUD operations for clothing items with image upload
- **AI Stylist**: Chat-based outfit suggestions using OpenAI GPT-4
- **Outfit Creation**: Manual and AI-generated outfit combinations
- **Trip Planning**: AI-powered packing list generation
- **Wishlist**: Save and track desired fashion items
- **Analytics**: Wear patterns, style insights, and wardrobe statistics
- **Real-time Features**: Socket.io for live updates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **AI**: OpenAI GPT-4 API
- **Image Storage**: Cloudinary
- **Real-time**: Socket.io
- **Validation**: Joi

## Setup

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB**:
   ```bash
   # Using local MongoDB or MongoDB Atlas
   ```

4. **Development**:
   ```bash
   npm run dev  # With nodemon auto-reload
   ```

5. **Production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Wardrobe
- `GET /api/wardrobe` - Get user's clothing items
- `POST /api/wardrobe` - Add new clothing item
- `PUT /api/wardrobe/:id` - Update clothing item
- `DELETE /api/wardrobe/:id` - Delete clothing item

### AI Stylist
- `POST /api/ai/chat` - Chat with AI stylist
- `POST /api/ai/generate-outfit` - Generate AI outfit
- `GET /api/ai/chats` - Get chat history

### Outfits
- `GET /api/outfits` - Get user's outfits
- `POST /api/outfits` - Create new outfit
- `PUT /api/outfits/:id` - Update outfit
- `POST /api/outfits/:id/wear` - Mark outfit as worn

### Trips
- `GET /api/trips` - Get user's trips
- `POST /api/trips` - Create new trip
- `POST /api/trips/:id/generate-packing` - Generate AI packing list

### Analytics
- `GET /api/analytics` - Get wardrobe analytics
- `GET /api/analytics/wear-patterns` - Get wear patterns
- `GET /api/analytics/style-insights` - Get style insights

## Database Models

- **User**: User accounts and preferences
- **ClothingItem**: Individual clothing pieces
- **Outfit**: Combinations of clothing items
- **AIChat**: Chat conversations with AI stylist
- **Trip**: Travel plans with packing lists

## Development

- **Linting**: ESLint configured
- **Testing**: Jest setup
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error middleware
- **Validation**: Joi schemas for all inputs
- **Security**: Helmet, CORS, rate limiting

## Deployment

The backend is configured for deployment on:
- **Heroku**
- **Railway**
- **Vercel**
- **AWS/DigitalOcean**

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update API documentation
4. Use conventional commits