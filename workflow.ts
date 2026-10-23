import {
  workflow,
  trigger,
  node,
  languageModel,
  memory,
  tool,
  fromAi,
  expr,
  newCredential,
  sticky,
  nodeJson,
} from '@n8n/workflow-sdk';

// ---------- Trigger : Gmail (polling every 5 min) ----------
const gmailTrigger = trigger({
  type: 'n8n-nodes-base.gmailTrigger',
  version: 1.2,
  config: {
    name: 'Gmail Trigger',
    parameters: {
      pollTimes: { item: [{ mode: 'everyX', value: 5, unit: 'minutes' }] },
      filters: {},
    },
    credentials: { gmailOAuth2: newCredential('Gmail account 2') },
  },
  output: [{ id: 'message-id', threadId: 'thread-id', snippet: 'Latest email snippet' }],
});

// ---------- Wait 1 minute before processing ----------
const waitNode = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait', parameters: { amount: 1 } },
  output: [{ id: 'message-id', threadId: 'thread-id', snippet: 'Latest email snippet' }],
});

// ---------- AI Agent : Gmail labelling ----------
const labellingAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 1.7,
  config: {
    name: 'Gmail labelling agent',
    onError: 'continueErrorOutput',
    parameters: {
      promptType: 'define',
      text: expr('Label the email based on the details below:\n{{ JSON.stringify($json) }}'),
      options: {
        systemMessage:
          'Objective:\n' +
          'Automatically categorize incoming emails based on existing Gmail labels or create a new label if none match.\n' +
          '\n' +
          'Tools:\n' +
          '- Get message\n' +
          '- Read all labels\n' +
          '- Create label\n' +
          '- Assign label to message\n' +
          '\n' +
          'Instructions:\n' +
          '\n' +
          'Label Matching:\n' +
          '\n' +
          'Analyze the email\'s subject, sender, recipient, keywords, and content.\n' +
          'Compare with existing Gmail labels to find the most relevant match.\n' +
          'Label Assignment:\n' +
          '\n' +
          'Assign the email to the most appropriate existing label.' +
          'Remove the inbox label if the email is of less importance (like ads, promotions, aka "Reclame"), keep normal and important emails in the inbox.\n' +
          'If no suitable label exists, create a new label based on the existing labels. Try reusing existing labels as much as possible. Always create a label as a sublabel, if no label applies, if the main label already exists, create the new label under the existing label, if no main label exists, create the label AI and create the new label under this label.\n' +
          'Label Creation:\n' +
          '\n' +
          'Ensure new labels align with the structure of existing ones, including capitalization, delimiters, and prefixes.\n' +
          'Examples:\n' +
          '\n' +
          'If the email subject is "Project Alpha Update," assign to [Project Alpha] if it exists.\n' +
          'For "New Vendor Inquiry," create "Vendor Inquiry" if no relevant label exists.\n' +
          'Outcome:\n' +
          'Emails are consistently categorized under the appropriate or newly created labels, maintaining Gmail\'s organizational structure.',
        maxIterations: 5,
      },
    },
    subnodes: {
      model: geminiModel,
      memory: windowMemory,
      tools: [gmailGetMessage, gmailReadLabels, gmailCreateLabel, gmailAddLabel],
    },
  },
  output: [{ output: 'Email categorized under the appropriate label (created if needed).' }],
});

// ---------- Google Gemini Chat Model (subnode of the agent) ----------
const geminiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Google Gemini Chat Model',
    parameters: { modelName: 'models/gemini-flash-lite-latest', options: {} },
    credentials: { googlePalmApi: newCredential('Google Gemini(PaLM) Api account') },
  },
  output: [{ text: 'The email is a routine update, no action needed.' }],
});

// ---------- Window Buffer Memory (subnode of the agent) ----------
const windowMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.3,
  config: {
    name: 'Window Buffer Memory',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: nodeJson(gmailTrigger, 'id'),
    },
  },
});

// ---------- Gmail Tools used by the agent ----------
const gmailGetMessage = tool({
  type: 'n8n-nodes-base.gmailTool',
  version: 2.1,
  config: {
    name: 'Gmail - get message',
    parameters: {
      descriptionType: 'manual',
      toolDescription: 'Tool to read a specific message based on the message ID',
      operation: 'get',
      messageId: fromAi('gmail_message_id', 'id of the gmail message, like 1944fdc33f544369', 'string'),
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') },
  },
  output: [{ id: '1a168c1ad98b0327', subject: 'Re: Project update' }],
});

const gmailReadLabels = tool({
  type: 'n8n-nodes-base.gmailTool',
  version: 2.1,
  config: {
    name: 'Gmail - read labels',
    parameters: {
      descriptionType: 'manual',
      toolDescription: 'Tool to read all existing gmail labels',
      resource: 'label',
      returnAll: true,
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') },
  },
  output: [{ id: 'Label_13', name: 'AI/Code Review', type: 'user' }],
});

const gmailCreateLabel = tool({
  type: 'n8n-nodes-base.gmailTool',
  version: 2.1,
  config: {
    name: 'Gmail - create label',
    parameters: {
      descriptionType: 'manual',
      toolDescription: 'Tool to create a new label, only use if label does not already exist',
      resource: 'label',
      operation: 'create',
      name: fromAi('new_label_name', 'new label name', 'string'),
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') },
  },
  output: [{ id: 'Label_13', name: 'AI/Code Review' }],
});

const gmailAddLabel = tool({
  type: 'n8n-nodes-base.gmailTool',
  version: 2.1,
  config: {
    name: 'Gmail - add label to message',
    parameters: {
      descriptionType: 'manual',
      toolDescription: 'Tool to add label to message',
      operation: 'addLabels',
      messageId: fromAi('gmail_message_id', 'id of the gmail message', 'string'),
      labelIds: [fromAi('gmail_label_id', 'a single Gmail label id, e.g. Label_123 (not the label name)')],
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') },
  },
  output: [{ labelIds: ['Label_13'] }],
});

// ---------- Flow ----------
const objectiveNote = sticky(
  'Objectif : classé automatiquement chaque email entrant dans le label Gmail approprié (Google Gemini). ' +
    'Crée un label si aucun existant ne convient, en réutilisant la structure des labels existants.',
);

export default workflow('gmail-labelling-agent', 'Basic automatic Gmail email labelling with google gemini and Gmail API')
  .add(gmailTrigger)
  .to(waitNode)
  .to(labellingAgent)
  .add(objectiveNote);
