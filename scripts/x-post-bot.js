import { TwitterApi } from 'twitter-api-v2';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const QUESTIONS_PATH = path.resolve('./src/data/questions.json');
const BASE_URL = 'https://touhan-quiz.com/questions/';

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

async function postDailyQuestion() {
    try {
        // 1. Load questions
        const rawData = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
        const questions = JSON.parse(rawData);

        // 2. Filter Chapters 3, 4, 5
        const targetChapters = [3, 4, 5];
        const filteredQuestions = questions.filter(q => targetChapters.includes(q.chapter));

        if (filteredQuestions.length === 0) {
            throw new Error('No questions found for the specified chapters.');
        }

        // 3. Select one at random
        const randomQuestion = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];

        const mainTweetContent = `${randomQuestion.question}\n\n#登録販売者 #登録販売者試験`;
        const replyTweetContent = `【答え】\n${randomQuestion.isCorrect ? '○' : '×'}\n\n【詳細解説】\n${BASE_URL}${randomQuestion.id}`;

        if (isDryRun) {
            console.log('--- DRY RUN MODE ---');
            console.log('[MAIN TWEET]');
            console.log(mainTweetContent);
            console.log('\n[REPLY TWEET]');
            console.log(replyTweetContent);
            console.log('--------------------');
            return;
        }

        // 4. Initialize X API Client
        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET,
            accessToken: process.env.X_ACCESS_TOKEN,
            accessSecret: process.env.X_ACCESS_SECRET,
        });

        // 5. Post to X
        console.log('Posting main tweet...');
        const mainTweet = await client.v2.tweet(mainTweetContent);
        console.log(`Main tweet posted! ID: ${mainTweet.data.id}`);

        console.log('Posting reply tweet...');
        await client.v2.reply(replyTweetContent, mainTweet.data.id);
        console.log('Reply tweet posted!');

    } catch (error) {
        console.error('Error in postDailyQuestion:', error);
        process.exit(1);
    }
}

postDailyQuestion();
