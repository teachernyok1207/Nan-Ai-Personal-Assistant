export function formatConversation(conversation){
    return conversation.map((convey, i) => {
    if (i % 2 === 0) {
        return `Human: ${convey}`
    } else {
        return `AI: ${convey}`
    }
    }).join('\n')
}