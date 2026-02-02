# Agents & Agentic Actions - Concept & Implementation Guide

## What Are Agents/Agentic Actions?

### Simple Definition
**Agents** are AI assistants that can **do things** beyond just chatting. Instead of only providing text responses, an agent can:
- Take actions in your systems
- Call external APIs
- Execute specific functions
- Trigger workflows
- Make decisions and perform multi-step tasks

### The Difference

**Traditional Chatbot** (What you have now):
```
User: "What are your business hours?"
Bot: "We're open Monday-Friday, 9am-5pm"
```

**Agentic Chatbot** (With agents):
```
User: "Book me an appointment for Tuesday at 2pm"
Bot: "I'll book that for you..."
     [Checks calendar API]
     [Creates appointment]
     [Sends confirmation email]
Bot: "✅ Appointment booked for Tuesday, Feb 4 at 2pm. Confirmation sent to your email."
```

---

## Real-World Use Cases

### Customer Support Agents
1. **Order Lookup Agent**
   - User: "Where's my order #12345?"
   - Agent: Calls order tracking API → Returns real-time status

2. **Ticket Creation Agent**
   - User: "I need help with billing"
   - Agent: Creates support ticket → Assigns to billing team → Returns ticket number

3. **Account Management Agent**
   - User: "Update my email address"
   - Agent: Validates email → Updates database → Sends verification

### E-commerce Agents
4. **Product Search Agent**
   - User: "Show me blue shirts under $50"
   - Agent: Queries product database → Filters by criteria → Shows results with images

5. **Refund Processing Agent**
   - User: "I want to return order #789"
   - Agent: Validates order → Checks return policy → Initiates refund → Provides return label

### Booking/Scheduling Agents
6. **Appointment Booking Agent**
   - User: "Schedule a consultation"
   - Agent: Checks availability → Shows time slots → Books appointment → Adds to calendar

7. **Cancellation Agent**
   - User: "Cancel my appointment tomorrow"
   - Agent: Finds appointment → Cancels → Sends confirmation → Updates calendar

### Integration Agents
8. **CRM Agent**
   - Agent: Creates/updates contacts in Salesforce, HubSpot, etc.

9. **Email Agent**
   - Agent: Sends follow-up emails, notifications, receipts

10. **Payment Agent**
    - Agent: Processes payments via Stripe, PayPal, etc.

---

## How Agents Work (Technical Overview)

### Architecture Flow
```
User Message
    ↓
AI Analyzes Intent
    ↓
Determines Action Needed
    ↓
Calls Appropriate Agent/Function
    ↓
Agent Executes (API call, database query, etc.)
    ↓
Returns Result
    ↓
AI Formats Response
    ↓
User Sees Outcome
```

### Example Implementation
```javascript
// User asks: "What's the status of order #12345?"

// 1. AI detects "order status" intent
const intent = detectIntent(userMessage); // "check_order_status"

// 2. Extract order number
const orderNumber = extractEntity(userMessage, 'order_number'); // "12345"

// 3. Call Order Status Agent
const result = await agents.orderStatus.execute({
    orderNumber: orderNumber
});

// 4. Format response
const response = `Your order #${orderNumber} is ${result.status}.
Expected delivery: ${result.deliveryDate}`;
```

---

## Types of Agents to Offer

### Tier 1: Basic Actions (Suggested Add-on: $29/month)
- **Form Submission Agent**: Collect structured data
- **Email Notification Agent**: Send emails via SMTP
- **Webhook Agent**: Trigger external webhooks
- **Data Lookup Agent**: Query custom databases

### Tier 2: Integration Agents (Suggested Add-on: $49/month)
- **CRM Integration**: Salesforce, HubSpot, Pipedrive
- **Help Desk Integration**: Zendesk, Freshdesk, Intercom
- **Calendar Integration**: Google Calendar, Outlook
- **E-commerce Integration**: Shopify, WooCommerce, Stripe

### Tier 3: Advanced Agents (Suggested Add-on: $99/month)
- **Appointment Booking**: Full scheduling system
- **Order Management**: Track, modify, cancel orders
- **Custom API Integration**: Connect to any REST API
- **Multi-Step Workflows**: Chain multiple actions together

### Tier 4: Enterprise Agents (Custom Pricing)
- **Custom Agent Development**: Build specific agents for unique needs
- **AI Model Fine-Tuning**: Train AI on specific business logic
- **Multi-System Orchestration**: Complex workflows across systems
- **Advanced Analytics**: Track agent performance and outcomes

---

## Implementation Strategy for Strikebot

### Add-On Structure

#### Option 1: Agent Packs (Recommended)
```typescript
{
    name: "Basic Agent Pack",
    price: 29,
    includes: [
        "Form Submission Agent",
        "Email Notification Agent",
        "Webhook Trigger Agent",
        "Custom Database Queries"
    ],
    maxActions: 1000 // per month
}

{
    name: "Integration Agent Pack",
    price: 49,
    includes: [
        "All Basic Agents",
        "CRM Integration (choose 1)",
        "Help Desk Integration (choose 1)",
        "Calendar Integration"
    ],
    maxActions: 5000
}

{
    name: "Advanced Agent Pack",
    price: 99,
    includes: [
        "All Integration Agents",
        "Appointment Booking System",
        "Order Management Agent",
        "Custom API Connector",
        "Workflow Builder"
    ],
    maxActions: "unlimited"
}
```

#### Option 2: Individual Agents (À la carte)
```typescript
{
    name: "Email Agent",
    price: 9,
    description: "Send automated emails from chatbot"
}

{
    name: "CRM Agent",
    price: 19,
    description: "Create/update CRM contacts",
    requiresSetup: true
}

{
    name: "Booking Agent",
    price: 29,
    description: "Schedule appointments automatically"
}
```

---

## Technical Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Database Schema
```sql
-- Agent configurations table
CREATE TABLE wp_strikebot_agents (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    chatbot_id bigint(20) NOT NULL,
    agent_type varchar(50) NOT NULL, -- 'webhook', 'email', 'crm', etc.
    agent_name varchar(100),
    config longtext, -- JSON config for agent
    is_active tinyint(1) DEFAULT 1,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Agent execution logs
CREATE TABLE wp_strikebot_agent_logs (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    agent_id bigint(20) NOT NULL,
    session_id varchar(100),
    action_type varchar(50),
    input_data longtext,
    output_data longtext,
    status varchar(20), -- 'success', 'failed', 'pending'
    error_message text,
    executed_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY agent_id (agent_id),
    KEY session_id (session_id)
);

-- Agent usage tracking (for billing)
CREATE TABLE wp_strikebot_agent_usage (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    chatbot_id bigint(20) NOT NULL,
    agent_type varchar(50),
    month varchar(7), -- '2026-02'
    action_count int DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY chatbot_month (chatbot_id, agent_type, month)
);
```

#### 1.2 Agent Configuration UI
Add to WordPress admin:
```php
// New admin page: "Agents" tab
- List of available agents
- Enable/disable toggles
- Configuration forms per agent type
- Test buttons to verify setup
- Usage statistics dashboard
```

### Phase 2: Basic Agents (Weeks 3-4)

#### 2.1 Webhook Agent
```typescript
// Website builder config
interface WebhookAgentConfig {
    name: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    triggerPhrase?: string; // Optional: only trigger on specific phrases
    includeSessionData: boolean;
}

// WordPress implementation
class WebhookAgent {
    public function execute($data) {
        $config = $this->getConfig();

        $response = wp_remote_post($config['webhookUrl'], [
            'headers' => $config['headers'],
            'body' => json_encode([
                'message' => $data['message'],
                'session_id' => $data['session_id'],
                'timestamp' => current_time('mysql')
            ])
        ]);

        return $this->handleResponse($response);
    }
}
```

#### 2.2 Email Agent
```typescript
interface EmailAgentConfig {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail: string;
    fromName: string;
    templates: EmailTemplate[];
}

interface EmailTemplate {
    trigger: string; // What message triggers this
    to: string; // Email recipient
    subject: string;
    body: string; // Supports variables like {{user_name}}
}

// Example usage:
// User: "Send me pricing information"
// Bot: Detects intent → Triggers email agent → Sends pricing email
```

#### 2.3 Form Collection Agent
```typescript
// Collect structured data through conversation
interface FormAgentConfig {
    formName: string;
    fields: FormField[];
    webhookUrl?: string; // Where to send completed form
    successMessage: string;
}

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'date';
    required: boolean;
    validation?: string; // Regex pattern
}

// Example flow:
// Bot: "I can help you schedule a call. What's your name?"
// User: "John Smith"
// Bot: "Great! What's your email address?"
// User: "john@example.com"
// Bot: "Perfect! What date works for you?"
// [Collects all fields → Submits → Confirms]
```

### Phase 3: Integration Agents (Weeks 5-8)

#### 3.1 CRM Agent (HubSpot Example)
```typescript
interface CRMAgentConfig {
    provider: 'hubspot' | 'salesforce' | 'pipedrive';
    apiKey: string;
    actions: {
        createContact: boolean;
        updateContact: boolean;
        createDeal: boolean;
        logActivity: boolean;
    };
    autoSync: boolean; // Auto-sync all conversations
}

// Implementation
class HubSpotAgent {
    async createContact(data: ContactData) {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    email: data.email,
                    firstname: data.firstName,
                    lastname: data.lastName,
                    phone: data.phone,
                    source: 'Strikebot Chat'
                }
            })
        });

        return response.json();
    }
}
```

#### 3.2 Calendar Agent (Google Calendar Example)
```typescript
interface CalendarAgentConfig {
    provider: 'google' | 'outlook';
    clientId: string;
    clientSecret: string;
    calendarId: string;
    appointmentDuration: number; // minutes
    availableHours: {
        start: string; // "09:00"
        end: string; // "17:00"
    };
    bufferTime: number; // minutes between appointments
}

// Implementation
class CalendarAgent {
    async checkAvailability(date: string) {
        // Query Google Calendar API
        // Return available time slots
    }

    async bookAppointment(date: string, time: string, details: any) {
        // Create event in calendar
        // Send confirmation email
        // Return booking confirmation
    }
}
```

#### 3.3 Help Desk Agent (Zendesk Example)
```typescript
interface HelpDeskAgentConfig {
    provider: 'zendesk' | 'freshdesk' | 'intercom';
    domain: string; // 'yourcompany.zendesk.com'
    apiToken: string;
    autoCreateTicket: boolean;
    assignToGroup?: string;
    ticketPriority: 'low' | 'normal' | 'high' | 'urgent';
}

// Implementation
class ZendeskAgent {
    async createTicket(data: TicketData) {
        const response = await fetch(`https://${this.config.domain}/api/v2/tickets.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(this.config.apiToken)}`
            },
            body: JSON.stringify({
                ticket: {
                    subject: data.subject,
                    comment: { body: data.description },
                    requester: { name: data.name, email: data.email },
                    priority: this.config.ticketPriority,
                    custom_fields: [
                        { id: 360000000001, value: 'strikebot_chat' }
                    ]
                }
            })
        });

        const result = await response.json();
        return {
            ticketId: result.ticket.id,
            ticketUrl: `https://${this.config.domain}/agent/tickets/${result.ticket.id}`
        };
    }
}
```

### Phase 4: AI Function Calling (Weeks 9-10)

#### 4.1 Function Definitions
```typescript
// Define functions for OpenAI/Claude function calling
const agentFunctions = [
    {
        name: "check_order_status",
        description: "Check the status of a customer order",
        parameters: {
            type: "object",
            properties: {
                order_number: {
                    type: "string",
                    description: "The order number to look up"
                }
            },
            required: ["order_number"]
        }
    },
    {
        name: "book_appointment",
        description: "Book an appointment for the user",
        parameters: {
            type: "object",
            properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
                time: { type: "string", description: "Time in HH:MM format" },
                service: { type: "string", description: "Type of service requested" }
            },
            required: ["date", "time"]
        }
    },
    {
        name: "create_support_ticket",
        description: "Create a support ticket",
        parameters: {
            type: "object",
            properties: {
                subject: { type: "string", description: "Ticket subject" },
                description: { type: "string", description: "Detailed description" },
                priority: { type: "string", enum: ["low", "normal", "high"] }
            },
            required: ["subject", "description"]
        }
    }
];

// Send to OpenAI API
const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: 'gpt-4',
        messages: conversationHistory,
        functions: agentFunctions, // Include function definitions
        function_call: 'auto' // Let AI decide when to call functions
    })
});

// Handle function calls
if (response.choices[0].message.function_call) {
    const functionName = response.choices[0].message.function_call.name;
    const functionArgs = JSON.parse(response.choices[0].message.function_call.arguments);

    // Execute the appropriate agent
    const result = await executeAgent(functionName, functionArgs);

    // Send result back to AI for formatting
    const finalResponse = await getAIResponse(result);
}
```

### Phase 5: Advanced Features (Weeks 11-12)

#### 5.1 Workflow Builder
Visual interface to chain multiple agents:
```
Trigger: User says "I need help"
    ↓
Step 1: Collect user info (Form Agent)
    ↓
Step 2: Create CRM contact (CRM Agent)
    ↓
Step 3: Create support ticket (Help Desk Agent)
    ↓
Step 4: Send confirmation email (Email Agent)
    ↓
Step 5: Schedule follow-up (Calendar Agent)
```

#### 5.2 Conditional Logic
```typescript
interface WorkflowStep {
    agent: string;
    config: any;
    conditions?: {
        if: string; // Field to check
        equals: any; // Value to match
        then: WorkflowStep; // Next step if true
        else: WorkflowStep; // Next step if false
    };
}

// Example: Route based on urgency
{
    agent: "sentiment_analysis",
    conditions: {
        if: "urgency_level",
        equals: "high",
        then: { agent: "create_urgent_ticket" },
        else: { agent: "add_to_queue" }
    }
}
```

#### 5.3 Custom API Agent
```typescript
interface CustomAPIConfig {
    name: string;
    description: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    authentication: {
        type: 'none' | 'api_key' | 'bearer' | 'oauth';
        credentials: any;
    };
    requestMapping: {
        // Map chat variables to API parameters
        [chatVar: string]: string; // API field name
    };
    responseMapping: {
        // Map API response to chat variables
        [apiField: string]: string; // Chat variable name
    };
}

// Example: Custom order lookup API
{
    name: "Order Lookup",
    endpoint: "https://api.mystore.com/orders/{order_id}",
    method: "GET",
    headers: {
        "X-API-Key": "{{api_key}}"
    },
    requestMapping: {
        "order_number": "order_id" // Chat variable → API parameter
    },
    responseMapping: {
        "status": "order_status",
        "tracking_number": "tracking",
        "estimated_delivery": "delivery_date"
    }
}
```

---

## Website Builder UI Design

### Agents Tab in Settings
```
┌─────────────────────────────────────────┐
│  Agents & Actions                        │
├─────────────────────────────────────────┤
│                                          │
│  [Enable Agents] Toggle                  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Available Agent Packs               │ │
│  │                                     │ │
│  │ ○ Basic Agent Pack - $29/month     │ │
│  │   ✓ Webhook Trigger                │ │
│  │   ✓ Email Notifications            │ │
│  │   ✓ Form Collection                │ │
│  │   ✓ Database Queries               │ │
│  │   [Select Plan]                    │ │
│  │                                     │ │
│  │ ○ Integration Pack - $49/month     │ │
│  │   ✓ All Basic Agents               │ │
│  │   ✓ CRM Integration                │ │
│  │   ✓ Help Desk Integration          │ │
│  │   ✓ Calendar Integration           │ │
│  │   [Select Plan] [Current Plan]     │ │
│  │                                     │ │
│  │ ○ Advanced Pack - $99/month        │ │
│  │   ✓ All Integration Agents         │ │
│  │   ✓ Appointment Booking            │ │
│  │   ✓ Custom API Connector           │ │
│  │   ✓ Workflow Builder               │ │
│  │   [Select Plan]                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Configured Agents (2)               │ │
│  │                                     │ │
│  │ 📧 Email Notification Agent         │ │
│  │    Status: ✅ Active                │ │
│  │    Actions this month: 47/1000     │ │
│  │    [Configure] [Test] [Disable]    │ │
│  │                                     │ │
│  │ 🎫 Zendesk Ticket Agent            │ │
│  │    Status: ✅ Active                │ │
│  │    Actions this month: 23/1000     │ │
│  │    Tickets created: 23             │ │
│  │    [Configure] [Test] [Disable]    │ │
│  │                                     │ │
│  │ [+ Add New Agent]                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Agent Configuration Modal
```
┌─────────────────────────────────────────┐
│  Configure Email Agent                   │
├─────────────────────────────────────────┤
│                                          │
│  Agent Name:                             │
│  [Customer Support Email            ]   │
│                                          │
│  From Email:                             │
│  [support@yoursite.com              ]   │
│                                          │
│  From Name:                              │
│  [Support Team                      ]   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Email Templates                     │ │
│  │                                     │ │
│  │ Template 1: "Contact Form"         │ │
│  │ Trigger: "contact" OR "get in touch"│ │
│  │ To: admin@yoursite.com             │ │
│  │ Subject: New Contact Request       │ │
│  │ [Edit] [Delete]                    │ │
│  │                                     │ │
│  │ [+ Add Template]                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Test Agent]  [Save]  [Cancel]         │
└─────────────────────────────────────────┘
```

---

## Pricing Strategy

### Recommended Pricing

| Pack | Price/Month | Actions Included | Best For |
|------|-------------|------------------|----------|
| **Basic Agent Pack** | $29 | 1,000 actions | Small businesses needing simple automation |
| **Integration Pack** | $49 | 5,000 actions | Growing businesses with CRM/help desk |
| **Advanced Pack** | $99 | Unlimited | E-commerce, booking systems, complex workflows |
| **Enterprise** | Custom | Unlimited + Custom | Large organizations with unique needs |

### Additional Revenue Streams
- **Action Overages**: $0.05 per action over limit
- **Custom Agent Development**: $500-$2000 per agent
- **Premium Integrations**: $19/month per additional CRM
- **Priority Support**: $49/month

---

## Benefits of Agents

### For Your Customers
✅ **Automation**: Reduce manual work
✅ **Integration**: Connect all their tools
✅ **Efficiency**: Handle tasks instantly
✅ **Scalability**: Unlimited simultaneous actions
✅ **Insights**: Track what users need help with

### For Your Business
✅ **Higher Revenue**: Premium add-ons at $29-$99/month
✅ **Stickiness**: Integrated systems = harder to leave
✅ **Differentiation**: Most chatbots can't do this
✅ **Upsell Path**: Start basic, upgrade to advanced
✅ **Recurring Revenue**: Monthly subscription model

---

## Next Steps

### To Implement Agents in Strikebot:

1. **Decide on Approach**
   - Agent Packs (recommended) vs. Individual agents
   - Pricing tiers
   - Which agents to build first

2. **Technical Planning**
   - Database schema (provided above)
   - API integrations to prioritize
   - UI/UX design for agent configuration

3. **MVP Development** (Recommended First Agents)
   - Webhook Agent (easiest to implement)
   - Email Agent (high demand)
   - Form Collection Agent (versatile)

4. **Beta Testing**
   - Offer free access to select customers
   - Gather feedback on usability
   - Refine based on real-world usage

5. **Launch Strategy**
   - Documentation and tutorials
   - Video walkthroughs
   - Example use cases and templates

### Questions to Consider:

1. **Which industries are you targeting?**
   - E-commerce → Order tracking, product search
   - Services → Appointment booking, scheduling
   - Support → Ticket creation, FAQ automation
   - B2B → CRM integration, lead capture

2. **What's your technical capacity?**
   - Build in-house vs. use third-party platforms
   - Maintenance and support requirements
   - Scaling considerations

3. **Pricing philosophy?**
   - High-value low-volume vs. low-cost high-volume
   - Action limits or unlimited?
   - Custom enterprise pricing?

---

## Conclusion

**Agents transform your chatbot from a Q&A tool into an action-taking assistant.** This is where the real value is for customers - automation that saves time and money.

**Recommended Implementation Path:**
1. Start with Basic Agent Pack ($29/month)
2. Build 3-4 simple agents (webhook, email, form)
3. Launch and gather feedback
4. Expand to Integration Pack with CRM/help desk
5. Add advanced features based on customer demand

**Expected Business Impact:**
- 30-50% of customers upgrade to agent packs
- Average revenue per user increases by $29-$99/month
- Customer retention improves (integrated tools = stickiness)
- Competitive advantage in chatbot market

Want me to help you implement specific agents? I can start with any of the basic agents or help you design the database schema and configuration UI.
