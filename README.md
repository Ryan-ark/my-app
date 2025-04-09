# Aqua Intelligence

An AI-powered system for managing aquaponic fish feeding and water quality monitoring.

## Features

### AI Assistant
- Ask questions about fish feeding, water quality, or system maintenance
- Get AI-generated responses based on real-time sensor data
- View growth forecasting and water quality predictions

### Feed Fish Scheduling
- Create and manage feeding schedules
- View schedules in calendar or list format
- Set up recurring feeding schedules
- Track completed feedings
- Customize feed types and amounts

## Database Schema

The application uses MongoDB with Prisma ORM for data management.

Key models include:
- `SensorReading`: Stores fish tank sensor data (temperature, pH, DO, etc.)
- `FeedingSchedule`: Stores feeding schedules with customizable options

## API Routes

### Sensor Data
- `GET /api/sensor` - Get all sensor readings
- `POST /api/sensor` - Add a new sensor reading

### Feeding Schedules
- `GET /api/feeding` - Get all feeding schedules
- `POST /api/feeding` - Create a new feeding schedule
- `GET /api/feeding/[id]` - Get a specific feeding schedule
- `PATCH /api/feeding/[id]` - Update a feeding schedule
- `DELETE /api/feeding/[id]` - Delete a feeding schedule

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run the development server: `npm run dev`

## Technologies Used

- Next.js 14
- React
- Tailwind CSS
- MongoDB with Prisma
- Firebase Realtime Database for sensor data
- Groq AI for AI assistant features

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
