const API_KEY = 'AIzaSyAuyU6yz4VfeCfhqjc9fTJfx7cewsK0uA4';
        //Prompt for the gemini to generate news
        const systemPrompt = (category) => `
            Act as a news service. Provide 5 latest news headlines for the ${category} category. 
            For each news item, include:
            1. Title
            2. Brief description (2 sentences)
            3. Sentiment analysis (positive, negative, or neutral)
            4. Key emotional words or phrases from the content
            
            Format each news item as a JSON object with properties: 
            title, description, sentiment, emotionalWords.
            Respond with an array of these objects.
        `;

        // Fetch news from the Gemini API
        async function getNewsFromGemini(category) {
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt(category) }] }]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('Invalid response format from API');
                }

                const text = data.candidates[0].content.parts[0].text;
                try {
                    return JSON.parse(text);
                } catch {
                    const match = text.match(/\[(.*)\]/s);
                    if (match) {
                        return JSON.parse(`[${match[1]}]`);
                    }
                    throw new Error('Failed to parse API response');
                }
            } catch (error) {
                throw new Error(`Failed to fetch news: ${error.message}`);
            }
        }

        
        function getSentimentColor(sentiment) {
            const colors = {
                positive: '#4CAF50',
                negative: '#F44336',
                neutral: '#9E9E9E'
            };
            return colors[sentiment.toLowerCase()] || colors.neutral;
        }

        //Function to display the news in organized format
        async function displayNews() {
            const newsDiv = document.querySelector("#news");
            newsDiv.innerHTML = '<div class="loading">Loading news...</div>';

            try {
                const selectedRadio = document.querySelector('input[name="type"]:checked');
                if (!selectedRadio) {
                    throw new Error('Please select a news category');
                }

                const category = selectedRadio.value;
                const newsItems = await getNewsFromGemini(category);

                if (!Array.isArray(newsItems)) {
                    throw new Error('Invalid response format');
                }

                newsDiv.innerHTML = '';

                newsItems.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.className = 'news-item';
                    div.innerHTML = `
                        <h3>${index + 1}. ${item.title}
                            <span class="sentiment" 
                                  style="background-color: ${getSentimentColor(item.sentiment)}">
                                ${item.sentiment.toUpperCase()}
                            </span>
                        </h3>
                        <p>${item.description}</p>
                        <p><strong>Key phrases:</strong> ${Array.isArray(item.emotionalWords) ? 
                            item.emotionalWords.join(', ') : item.emotionalWords}</p>
                    `;
                    newsDiv.appendChild(div);
                });
            } catch (error) {
                newsDiv.innerHTML = `<div class="news-item" style="color: red;">
                    Error: ${error.message}
                </div>`;
            }
        }

        //Event listener for the form submission
        document.querySelector("#typeForm").addEventListener("submit", (e) => {
            e.preventDefault();
            displayNews();
        });
    