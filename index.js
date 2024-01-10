import { ChatOpenAI } from "langchain/chat_models/openai"
import { PromptTemplate } from "langchain/prompts"
import { StringOutputParser } from "langchain/schema/output_parser"
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

import { combineDocs } from "./utils/combineDocs"
import { retriever } from "./utils/retriever"
import { formatConversation } from "./utils/formatConversation"

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY
const llm = new ChatOpenAI ({ openAIApiKey })

const standaloneQuestionTemplate = `Based on the conversation history (if applicable) and a question, convert a question into standalone question, conversation history: {conversation_history}
question: {question} standalone question: `

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are very helpful and enthusiastic support bot who can answer a given question about about me based on the context provided. Try to find the answer in the context. If you don't know the answer, just say "I'm sorry anak! I don't know the answer." Please alaways start your answer with "Hi anak! " and nothing else, you don't need to mention my name. Don't try to make up an answer. Always speak like you are giving an answer like a mother to your child whose asking you and don't add the phrase, "Based on the context" or relevant phrases.
context: {context}
question: {question}
answer: `

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

const standaloneQuestionChain = standaloneQuestionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser())
  
const retrieverChain = RunnableSequence.from([
  prevResult => prevResult.standalone_question,
  retriever,
  combineDocs
])

const answerChain = answerPrompt
  .pipe(llm)
  .pipe(new StringOutputParser())


const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough()
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question
  },
  answerChain
])

const conversationHistory = []

document.addEventListener("submit",(e) => {
  e.preventDefault()
  progressConversation()
})

async function progressConversation(){
  const chatArea = document.getElementById("chatArea")
  const chatRoot = document.getElementById("chat-root")
  const question = chatArea.value
  chatArea.value = ""
  
  const currentDate = new Date().toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true })
  
  const newHumanBubble = document.createElement("div")
  newHumanBubble.classList.add("chat-div")
  newHumanBubble.innerHTML = `
    <p class="chat-time">${currentDate}</p>
    <div class="chat-details">
      <img class="chat-picture" src="/assets/Bald-Guy.png" alt="Human Profile">
      <div class="chat-human-message">
        ${question}
      </div>
    </div>
  `
  chatRoot.appendChild(newHumanBubble)
  chatRoot.scrollTop = chatRoot.scrollHeight
  
  const loadingRoot = document.createElement("div")
  loadingRoot.classList.add("chat-div")
  loadingRoot.innerHTML=`
    <img src="/assets/Loading.gif" class="loading-gif">
  `
  chatRoot.appendChild(loadingRoot)
  chatRoot.scrollTop = chatRoot.scrollHeight
  
  const response = await chain.invoke({ 
    question: question,
    conversation_history: formatConversation(conversationHistory)
  })
  conversationHistory.push(question)
  conversationHistory.push(response)
  
  loadingRoot.remove()
  
  const newAiBubble = document.createElement("div")
  newAiBubble.classList.add("chat-div")
  newAiBubble.innerHTML = `
    <p class="chat-time">${currentDate}</p>
    <div class="chat-details">
      <div class="chat-ai-message">
        ${response}
      </div>
      <img class="chat-picture" src="/assets/Nan-Ai.png" alt="Human Profile">
    </div>
  `
  chatRoot.appendChild(newAiBubble)
  chatRoot.scrollTop = chatRoot.scrollHeight
}