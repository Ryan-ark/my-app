import { Groq } from 'groq-sdk';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({ 
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ForecastData {
  date: string;
  prediction: string;
  value: number;
  suggestion: string;
}

// Function to get chat completion
export async function getChatCompletion(messages: Message[]) {
  try {
    const response = await groq.chat.completions.create({
      messages,
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
}

// Function to get streaming chat completion
export async function getStreamingChatCompletion(messages: Message[]) {
  try {
    const stream = await groq.chat.completions.create({
      messages,
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
      stream: true,
      stop: null
    });
    
    return stream;
  } catch (error) {
    console.error('Error getting streaming chat completion:', error);
    throw error;
  }
}

// Function to get fish growth forecasts
export async function getFishGrowthForecast() {
  const prompt = `
    Generate fish growth forecasting data for the next 7 days for an aquaponic system.
    The response should be in JSON format with this structure:
    [{ 
      "date": "YYYY-MM-DD", 
      "prediction": "descriptive prediction",
      "value": number (predicted weight in grams),
      "suggestion": "actionable suggestion for optimal growth"
    }]
    Include variations in growth patterns and realistic values.
  `;
  
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Extract JSON from response - using workaround for dotAll flag
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ForecastData[];
    }
    
    throw new Error('Failed to parse forecast data');
  } catch (error) {
    console.error('Error getting fish growth forecast:', error);
    throw error;
  }
}

// Function to get water quality predictions
export async function getWaterQualityPredictions() {
  const prompt = `
    Generate water quality prediction data for the next 7 days for an aquaponic system.
    The response should be in JSON format with this structure:
    [{ 
      "date": "YYYY-MM-DD", 
      "prediction": "descriptive prediction for water quality",
      "value": number (predicted pH level between 6.0-8.5),
      "suggestion": "actionable suggestion for maintaining optimal water quality"
    }]
    Include variations in pH levels and realistic values.
  `;
  
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Extract JSON from response - using workaround for dotAll flag
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ForecastData[];
    }
    
    throw new Error('Failed to parse water quality prediction data');
  } catch (error) {
    console.error('Error getting water quality predictions:', error);
    throw error;
  }
}

// Function to get feeding optimization tips
export async function getFeedingOptimizationTips() {
  const prompt = `
    Provide 5 fish feeding optimization tips for an aquaponic system.
    The response should be in JSON format with this structure:
    [{ 
      "title": "short title for the tip",
      "description": "detailed explanation of the tip",
      "impact": "expected impact on fish growth or system health"
    }]
  `;
  
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
      stop: null
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Extract JSON from response - using workaround for dotAll flag
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse feeding optimization tips');
  } catch (error) {
    console.error('Error getting feeding optimization tips:', error);
    throw error;
  }
} 