export type McpTool = { name: string; description: string; args: string };

export type InboxMessage = {
  id: string;
  sender: string;
  handle: string;
  subject: string;
  preview: string;
  time: string;
  tags: string[];
  body: string[];
  signature: { name: string; role: string };
};

export type McpGuide = {
  pkg: string;
  apiName: string;
  console: { label: string; url: string };
  credsEnv: string;
};

export type McpConfig = {
  prefix: string;
  entityLabel: string;
  entityPlural: string;
  composeLabel: string;
  searchPlaceholder: string;
  tools: McpTool[];
  messages: InboxMessage[];
  guide: McpGuide;
};

export const mcpConfigs: Record<string, McpConfig> = {
  gmail: {
    prefix: 'gmail',
    entityLabel: 'email',
    entityPlural: 'messages',
    composeLabel: 'Compose',
    searchPlaceholder: 'Search inbox',
    tools: [
      {
        name: 'gmail_list_messages',
        description: "List messages in the user's mailbox",
        args: '{ q?: string, maxResults?: number }',
      },
      {
        name: 'gmail_get_message',
        description: 'Retrieve a specific message by ID',
        args: '{ id: string }',
      },
      {
        name: 'gmail_search_messages',
        description: 'Search inbox with query string',
        args: '{ q: string }',
      },
      {
        name: 'gmail_create_draft',
        description: 'Create a draft reply or new email',
        args: '{ to: string, subject: string, body: string }',
      },
      {
        name: 'gmail_apply_label',
        description: 'Apply or remove a label on a message',
        args: '{ id: string, label: string }',
      },
      {
        name: 'gmail_send_message',
        description: 'Send an approved draft or email',
        args: '{ draftId: string }',
      },
    ],
    messages: [
      {
        id: 'msg_9f21',
        sender: 'John Doe',
        handle: 'john.doe@acme.com',
        subject: 'Q2 Slides & Marketing Budget Proposal',
        preview:
          'Hey, could you send me the final Q2 slides and the marketing budget?',
        time: '6/7/2026',
        tags: ['UNREAD', 'URGENT'],
        body: [
          'Could you send me the final Q2 slides and the marketing budget proposal? I want to circulate them before the leadership sync on Friday.',
          'Appreciate it.',
        ],
        signature: { name: 'John Doe', role: 'Product Lead' },
      },
      {
        id: 'msg_4c88',
        sender: 'Sarah Jenkins',
        handle: 'sarah.j@finance.corp',
        subject: 'NDA for Client Review',
        preview: 'Hi, please review the final NDA terms from the client.',
        time: '6/7/2026',
        tags: ['UNREAD'],
        body: [
          'Please review the final NDA terms from the client. Let me know if everything is good to go so we can sign off and finalize the partnership in 2 days.',
        ],
        signature: { name: 'Sarah Jenkins', role: 'Director of Finance' },
      },
      {
        id: 'msg_1a05',
        sender: 'Alex Rivera',
        handle: 'alex.rivera@startup.io',
        subject: 'Coffee tomorrow at 4:30 PM?',
        preview: 'Hey! Are you free tomorrow at 4:30 PM for a quick catch up?',
        time: '6/7/2026',
        tags: [],
        body: [
          'Are you free tomorrow at 4:30 PM for a quick catch up? Would love to hear how the launch went.',
        ],
        signature: { name: 'Alex Rivera', role: 'Founder, Startup.io' },
      },
      {
        id: 'msg_7d63',
        sender: 'OpenAI Billing',
        handle: 'billing@openai.com',
        subject: 'Your monthly invoice is ready',
        preview: 'Your OpenAI API usage invoice for May is now available.',
        time: '6/8/2026',
        tags: [],
        body: [
          'Your OpenAI API usage invoice for May is now available. You can review the breakdown and download the receipt from your billing dashboard.',
        ],
        signature: { name: 'OpenAI', role: 'Billing Team' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-gmail',
      apiName: 'Gmail API',
      console: {
        label: 'Google Cloud Console',
        url: 'https://console.cloud.google.com',
      },
      credsEnv: 'GMAIL_CREDENTIALS',
    },
  },

  whatsapp: {
    prefix: 'whatsapp',
    entityLabel: 'chat',
    entityPlural: 'chats',
    composeLabel: 'New chat',
    searchPlaceholder: 'Search chats',
    tools: [
      {
        name: 'whatsapp_fetch_recent',
        description: 'Fetch recent messages across chats',
        args: '{ limit?: number }',
      },
      {
        name: 'whatsapp_read_history',
        description: 'Read chat history for a conversation',
        args: '{ chatId: string, limit?: number }',
      },
      {
        name: 'whatsapp_send_message',
        description: 'Send a message to a chat',
        args: '{ chatId: string, text: string }',
      },
      {
        name: 'whatsapp_search_chats',
        description: 'Search chats and conversations',
        args: '{ q: string }',
      },
      {
        name: 'whatsapp_summarize',
        description: 'Summarize a conversation',
        args: '{ chatId: string }',
      },
      {
        name: 'whatsapp_get_contact',
        description: 'Get contact details',
        args: '{ jid: string }',
      },
      {
        name: 'whatsapp_list_groups',
        description: 'List groups you belong to',
        args: '{ }',
      },
      {
        name: 'whatsapp_fetch_group',
        description: 'Fetch messages from a group',
        args: '{ groupId: string, limit?: number }',
      },
      {
        name: 'whatsapp_send_group',
        description: 'Send a message to a group',
        args: '{ groupId: string, text: string }',
      },
    ],
    messages: [
      {
        id: 'wa_2201',
        sender: 'Design Team',
        handle: 'Design Team · 6 members',
        subject: 'New mockups uploaded',
        preview: 'Maria: Just pushed the v3 mockups to Figma 🎨',
        time: '09:12',
        tags: ['UNREAD'],
        body: [
          'Just pushed the v3 mockups to Figma. Can everyone take a look and drop comments before standup?',
        ],
        signature: { name: 'Maria Lopez', role: 'Design Team' },
      },
      {
        id: 'wa_2202',
        sender: 'Daniel Cho',
        handle: '+1 (415) 555-0192',
        subject: 'Invoice question',
        preview: 'Hey, quick question about the March invoice.',
        time: '08:47',
        tags: ['UNREAD'],
        body: [
          'Quick question about the March invoice — was the discount already applied, or should I resend the PO?',
        ],
        signature: { name: 'Daniel Cho', role: 'Account Manager' },
      },
      {
        id: 'wa_2203',
        sender: 'Family',
        handle: 'Family · 4 members',
        subject: 'Dinner Sunday',
        preview: 'Mom: Are you coming over on Sunday? 🍲',
        time: 'Yesterday',
        tags: [],
        body: [
          'Are you coming over on Sunday? Let me know how many so I can plan the food.',
        ],
        signature: { name: 'Mom', role: 'Family' },
      },
    ],
    guide: {
      pkg: 'baileys',
      apiName: 'WhatsApp Web (Baileys, unofficial)',
      console: {
        label: 'Baileys documentation',
        url: 'https://github.com/WhiskeySockets/Baileys',
      },
      credsEnv: 'WHATSAPP_SESSION_SECRET',
    },
  },

  slack: {
    prefix: 'slack',
    entityLabel: 'message',
    entityPlural: 'messages',
    composeLabel: 'New message',
    searchPlaceholder: 'Search Slack',
    tools: [
      {
        name: 'slack_list_channels',
        description: 'List channels and direct messages',
        args: '{ types?: string }',
      },
      {
        name: 'slack_get_messages',
        description: 'Read messages from a channel',
        args: '{ channel: string, limit?: number }',
      },
      {
        name: 'slack_search_messages',
        description: 'Search workspace messages',
        args: '{ q: string }',
      },
      {
        name: 'slack_post_message',
        description: 'Post a message to a channel',
        args: '{ channel: string, text: string }',
      },
      {
        name: 'slack_set_alert_channel',
        description: 'Configure the alert channel',
        args: '{ channel: string }',
      },
    ],
    messages: [
      {
        id: 'sl_5510',
        sender: '#engineering',
        handle: 'posted by @priya',
        subject: 'Deploy to production is green',
        preview: 'priya: Prod deploy finished, all checks passing ✅',
        time: '10:33',
        tags: ['UNREAD'],
        body: [
          'Prod deploy finished, all checks passing. Release notes are in the thread — ping me if anything looks off.',
        ],
        signature: { name: 'Priya Nair', role: '#engineering' },
      },
      {
        id: 'sl_5511',
        sender: '#general',
        handle: 'posted by @sam',
        subject: 'All-hands moved to 3 PM',
        preview: 'sam: Heads up, all-hands moved to 3 PM today.',
        time: '09:58',
        tags: ['UNREAD'],
        body: [
          'Heads up — the all-hands moved to 3 PM today to accommodate the west-coast team. Calendar invite updated.',
        ],
        signature: { name: 'Sam Ortiz', role: '#general' },
      },
      {
        id: 'sl_5512',
        sender: 'Jordan Blake',
        handle: 'direct message',
        subject: 'Can you review my PR?',
        preview: 'jordan: When you get a sec, could you review #482?',
        time: '09:20',
        tags: [],
        body: [
          'When you get a sec, could you review PR #482? It unblocks the billing epic and I would love your eyes on the migration.',
        ],
        signature: { name: 'Jordan Blake', role: 'Direct message' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-slack',
      apiName: 'Slack Web API',
      console: {
        label: 'Slack API Dashboard',
        url: 'https://api.slack.com/apps',
      },
      credsEnv: 'SLACK_BOT_TOKEN',
    },
  },

  outlook: {
    prefix: 'outlook',
    entityLabel: 'email',
    entityPlural: 'messages',
    composeLabel: 'New email',
    searchPlaceholder: 'Search mail',
    tools: [
      {
        name: 'outlook_list_messages',
        description: 'List inbox messages',
        args: '{ folder?: string, top?: number }',
      },
      {
        name: 'outlook_get_message',
        description: 'Retrieve a message by ID',
        args: '{ id: string }',
      },
      {
        name: 'outlook_list_events',
        description: 'List upcoming calendar events',
        args: '{ days?: number }',
      },
      {
        name: 'outlook_create_draft',
        description: 'Create a draft email',
        args: '{ to: string, subject: string, body: string }',
      },
      {
        name: 'outlook_set_alert',
        description: 'Configure message alert rules',
        args: '{ rule: string }',
      },
    ],
    messages: [
      {
        id: 'ol_8801',
        sender: 'HR Notifications',
        handle: 'hr@company.com',
        subject: 'Benefits enrollment closes Friday',
        preview: 'Reminder: complete your benefits enrollment by Friday.',
        time: 'Mon 8:00 AM',
        tags: ['UNREAD'],
        body: [
          'This is a reminder to complete your annual benefits enrollment by Friday. Any elections not confirmed will roll over from last year.',
        ],
        signature: { name: 'People Operations', role: 'Human Resources' },
      },
      {
        id: 'ol_8802',
        sender: 'Rebecca Stone',
        handle: 'rebecca.stone@partner.co',
        subject: 'Contract renewal — next steps',
        preview: 'Hi, sharing the redlined contract for your review.',
        time: 'Mon 7:41 AM',
        tags: ['UNREAD'],
        body: [
          'Sharing the redlined contract for your review. If the pricing schedule works, we can route it for signature this week.',
        ],
        signature: { name: 'Rebecca Stone', role: 'Partnerships' },
      },
      {
        id: 'ol_8803',
        sender: 'Calendar',
        handle: 'calendar@company.com',
        subject: 'Quarterly review — 2:00 PM',
        preview: 'Your quarterly review starts in 30 minutes.',
        time: 'Fri',
        tags: [],
        body: [
          'Your quarterly business review starts at 2:00 PM in Conference Room B. The agenda deck is attached.',
        ],
        signature: { name: 'Outlook Calendar', role: 'Reminder' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-outlook',
      apiName: 'Microsoft Graph API',
      console: { label: 'Azure Portal', url: 'https://portal.azure.com' },
      credsEnv: 'OUTLOOK_CREDENTIALS',
    },
  },

  discord: {
    prefix: 'discord',
    entityLabel: 'message',
    entityPlural: 'messages',
    composeLabel: 'New message',
    searchPlaceholder: 'Search Discord',
    tools: [
      {
        name: 'discord_list_channels',
        description: 'List servers and channels',
        args: '{ guildId?: string }',
      },
      {
        name: 'discord_get_messages',
        description: 'Read messages from a channel',
        args: '{ channelId: string, limit?: number }',
      },
      {
        name: 'discord_search_messages',
        description: 'Search server messages',
        args: '{ q: string }',
      },
      {
        name: 'discord_post_message',
        description: 'Post a message to a channel',
        args: '{ channelId: string, content: string }',
      },
      {
        name: 'discord_manage_alert',
        description: 'Manage community alert rules',
        args: '{ channelId: string, enabled: boolean }',
      },
    ],
    messages: [
      {
        id: 'dc_3301',
        sender: '#announcements',
        handle: 'OmniMind Community',
        subject: 'v2.4 is live',
        preview: 'mod: We just shipped v2.4 with realtime sync! 🚀',
        time: '11:04',
        tags: ['UNREAD'],
        body: [
          'We just shipped v2.4 with realtime sync and faster search. Full changelog is pinned — let us know what you think in #feedback.',
        ],
        signature: { name: 'CommunityMod', role: '#announcements' },
      },
      {
        id: 'dc_3302',
        sender: '#support',
        handle: 'OmniMind Community',
        subject: 'Help with webhook setup',
        preview: 'user_42: Anyone got the webhook integration working?',
        time: '10:39',
        tags: ['UNREAD'],
        body: [
          'Anyone got the webhook integration working with a self-hosted server? I keep getting a 401 on the callback.',
        ],
        signature: { name: 'user_42', role: '#support' },
      },
      {
        id: 'dc_3303',
        sender: 'Taylor',
        handle: 'direct message',
        subject: 'GG last night',
        preview: 'taylor: gg last night, same time tomorrow?',
        time: 'Yesterday',
        tags: [],
        body: ['gg last night! Same time tomorrow? I will grab the others.'],
        signature: { name: 'Taylor', role: 'Direct message' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-discord',
      apiName: 'Discord Bot API',
      console: {
        label: 'Discord Developer Portal',
        url: 'https://discord.com/developers/applications',
      },
      credsEnv: 'DISCORD_BOT_TOKEN',
    },
  },

  linkedin: {
    prefix: 'linkedin',
    entityLabel: 'message',
    entityPlural: 'messages',
    composeLabel: 'New message',
    searchPlaceholder: 'Search messaging',
    tools: [
      {
        name: 'linkedin_list_messages',
        description: 'List conversations in the inbox',
        args: '{ unreadOnly?: boolean }',
      },
      {
        name: 'linkedin_get_message',
        description: 'Retrieve a conversation by ID',
        args: '{ id: string }',
      },
      {
        name: 'linkedin_list_invitations',
        description: 'List pending connection requests',
        args: '{ }',
      },
      {
        name: 'linkedin_send_message',
        description: 'Send a message in a conversation',
        args: '{ conversationId: string, body: string }',
      },
      {
        name: 'linkedin_get_activity',
        description: 'Summarize recent network activity',
        args: '{ days?: number }',
      },
    ],
    messages: [
      {
        id: 'li_7701',
        sender: 'Nina Patel',
        handle: 'Recruiter at Northwind',
        subject: 'Senior Engineer opportunity',
        preview: 'Hi, I came across your profile and thought of a role.',
        time: 'Tue',
        tags: ['UNREAD'],
        body: [
          'I came across your profile and thought you might be a great fit for a Senior Engineer role we are hiring for. Open to a quick chat this week?',
        ],
        signature: { name: 'Nina Patel', role: 'Recruiter at Northwind' },
      },
      {
        id: 'li_7702',
        sender: 'Marcus Lee',
        handle: 'Wants to connect',
        subject: 'Connection request',
        preview: 'Marcus Lee would like to connect with you.',
        time: 'Tue',
        tags: ['UNREAD'],
        body: [
          'Great meeting you at the conference last week — would love to stay connected and swap notes on the platform work.',
        ],
        signature: { name: 'Marcus Lee', role: 'Staff Engineer' },
      },
      {
        id: 'li_7703',
        sender: 'LinkedIn',
        handle: 'Notifications',
        subject: 'Your post reached 1,200 people',
        preview: 'Your recent post is getting attention.',
        time: 'Mon',
        tags: [],
        body: [
          'Your recent post about MCP integrations reached 1,200 people and earned 48 reactions. See who engaged with it.',
        ],
        signature: { name: 'LinkedIn', role: 'Notifications' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-linkedin',
      apiName: 'LinkedIn Marketing API',
      console: {
        label: 'LinkedIn Developers',
        url: 'https://www.linkedin.com/developers',
      },
      credsEnv: 'LINKEDIN_CREDENTIALS',
    },
  },

  telegram: {
    prefix: 'telegram',
    entityLabel: 'chat',
    entityPlural: 'chats',
    composeLabel: 'New chat',
    searchPlaceholder: 'Search chats',
    tools: [
      {
        name: 'telegram_list_chats',
        description: 'List chats and channels',
        args: '{ folder?: string }',
      },
      {
        name: 'telegram_get_messages',
        description: 'Retrieve messages from a chat',
        args: '{ chatId: string, limit?: number }',
      },
      {
        name: 'telegram_search_messages',
        description: 'Search across chats',
        args: '{ q: string }',
      },
      {
        name: 'telegram_send_message',
        description: 'Send a message to a chat',
        args: '{ chatId: string, text: string }',
      },
      {
        name: 'telegram_set_priority',
        description: 'Set priority for a chat',
        args: '{ chatId: string, priority: string }',
      },
    ],
    messages: [
      {
        id: 'tg_6601',
        sender: 'Dev Updates',
        handle: 'channel · 3.2k subscribers',
        subject: 'Build passed',
        preview: 'CI bot: main build passed in 4m 12s ✅',
        time: '12:05',
        tags: ['UNREAD'],
        body: [
          'main build passed in 4m 12s. Artifacts are ready for staging — deploy when you are set.',
        ],
        signature: { name: 'CI Bot', role: 'Dev Updates' },
      },
      {
        id: 'tg_6602',
        sender: 'Elena Frost',
        handle: '@elenafrost',
        subject: 'Meetup slides',
        preview: 'Can you send the slides from the meetup?',
        time: '11:31',
        tags: ['UNREAD'],
        body: [
          'Can you send the slides from the meetup? A few people asked and I want to share them in the group.',
        ],
        signature: { name: 'Elena Frost', role: 'Direct message' },
      },
      {
        id: 'tg_6603',
        sender: 'Weekend Trip',
        handle: 'group · 8 members',
        subject: 'Cabin booking',
        preview: "Raj: I found a cabin, let's split the cost.",
        time: 'Yesterday',
        tags: [],
        body: [
          "I found a cabin for the weekend trip — let's split the cost. Sending the link in a sec.",
        ],
        signature: { name: 'Raj', role: 'Weekend Trip' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-telegram',
      apiName: 'Telegram Bot API',
      console: { label: 'BotFather', url: 'https://t.me/botfather' },
      credsEnv: 'TELEGRAM_BOT_TOKEN',
    },
  },

  other: {
    prefix: 'custom',
    entityLabel: 'event',
    entityPlural: 'events',
    composeLabel: 'New action',
    searchPlaceholder: 'Search actions',
    tools: [
      {
        name: 'custom_dispatch_webhook',
        description: 'Dispatch a payload to your webhook',
        args: '{ url: string, payload: object }',
      },
      {
        name: 'custom_define_action',
        description: 'Define a custom action schema',
        args: '{ name: string, schema: object }',
      },
      {
        name: 'custom_list_actions',
        description: 'List configured custom actions',
        args: '{ }',
      },
      {
        name: 'custom_set_permission',
        description: 'Manage access permissions',
        args: '{ action: string, scope: string }',
      },
    ],
    messages: [
      {
        id: 'cx_1101',
        sender: 'order.created',
        handle: 'webhook event',
        subject: 'New order #10482',
        preview: 'Payload received from store webhook.',
        time: '13:20',
        tags: ['UNREAD'],
        body: [
          'A new order event was received from your store webhook. The assistant matched it to the "notify-ops" action.',
        ],
        signature: { name: 'order.created', role: 'Webhook event' },
      },
      {
        id: 'cx_1102',
        sender: 'ticket.updated',
        handle: 'webhook event',
        subject: 'Support ticket escalated',
        preview: 'Priority raised to high on ticket #77.',
        time: '12:52',
        tags: ['UNREAD'],
        body: [
          'Priority was raised to high on ticket #77. The assistant can route this to your on-call action.',
        ],
        signature: { name: 'ticket.updated', role: 'Webhook event' },
      },
      {
        id: 'cx_1103',
        sender: 'build.failed',
        handle: 'webhook event',
        subject: 'Nightly build failed',
        preview: 'Pipeline "nightly" failed at the test step.',
        time: 'Yesterday',
        tags: [],
        body: [
          'Pipeline "nightly" failed at the test step. A custom action can post this to your incident channel.',
        ],
        signature: { name: 'build.failed', role: 'Webhook event' },
      },
    ],
    guide: {
      pkg: '@modelcontextprotocol/server-webhook',
      apiName: 'Custom Webhook API',
      console: { label: 'your provider dashboard', url: '#' },
      credsEnv: 'CUSTOM_WEBHOOK_SECRET',
    },
  },
};

export function getMcpConfig(id: string): McpConfig {
  return mcpConfigs[id] ?? mcpConfigs.other;
}
