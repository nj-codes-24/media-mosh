/**
 * Text Reader Processor
 * Uses the native Web Speech API to read text files aloud.
 */

export const textReader = async (file: File, options: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            const resultData = {
                fullText: text,
                charCount: text.length,
                generated: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(resultData)], { type: 'application/json' });
            const jsonFile = new File([blob], 'speech_data.json', { type: 'application/json' });
            
            if (options.onProgress) options.onProgress({ ratio: 1.0 });
            
            resolve(jsonFile);
        };

        reader.onerror = () => reject(new Error("Failed to read text file"));
        reader.readAsText(file);
    });
};