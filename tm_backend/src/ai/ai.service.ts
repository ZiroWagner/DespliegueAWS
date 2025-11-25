import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY no está configurado');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateTask(prompt: string) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const fullPrompt = `
      Actúa como un asistente de productividad.
      Analiza la siguiente intención del usuario y genera un título y una descripción para una tarea.
      
      Intención: "${prompt}"
      
      Responde EXCLUSIVAMENTE con un objeto JSON válido con el siguiente formato, sin bloques de código ni texto adicional:
      {
        "title": "Título breve y accionable",
        "description": "Descripción detallada si es necesario, o vacía"
      }
    `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error parsing AI response:', text);
            throw new Error('No se pudo generar la tarea. Intenta ser más específico.');
        }
    }

    async generatePlan(prompt: string) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const fullPrompt = `
      Actúa como un Project Manager experto.
      Analiza la siguiente intención del usuario y genera un PLAN DE PROYECTO detallado con múltiples tareas (entre 3 y 10 tareas según complejidad).
      
      Intención: "${prompt}"
      
      Responde EXCLUSIVAMENTE con un ARRAY JSON válido con el siguiente formato, sin bloques de código ni texto adicional:
      [
        {
          "title": "Fase 1: Título de la tarea",
          "description": "Descripción detallada de qué hacer en esta tarea"
        },
        {
          "title": "Fase 2: ...",
          "description": "..."
        }
      ]
    `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Error parsing AI Plan response:', text);
            throw new Error('No se pudo generar el plan. Intenta ser más específico.');
        }
    }
}