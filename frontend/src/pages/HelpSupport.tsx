import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Help,
  ContactSupport,
  Email,
  Phone,
  Chat,
  Description,
  QuestionAnswer,
  Book,
  VideoLibrary,
  Send,
} from '@mui/icons-material';

const HelpSupport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create my first expense?',
          answer: 'To create your first expense, click the "Add Expense" button on the Expenses page or Dashboard. Fill in the description, amount, date, and category, then click "Add Expense" to save it.',
        },
        {
          question: 'How do I create a group?',
          answer: 'Navigate to the Groups page and click "Create Group". Enter a group name and description, then click "Create". You can then invite members to join your group.',
        },
        {
          question: 'How do I invite friends to a group?',
          answer: 'Open the group you want to invite people to, then click the "Invite" button. You can share the invite link or enter their email addresses to send invitations.',
        },
      ],
    },
    {
      category: 'Expenses',
      questions: [
        {
          question: 'How do I split an expense?',
          answer: 'When creating an expense, select a group and choose how to split it: equally, by percentage, by amount, or custom. The app will automatically calculate each person\'s share.',
        },
        {
          question: 'Can I edit or delete an expense?',
          answer: 'Yes, you can edit or delete expenses you\'ve created. Click on the expense to view details, then use the Edit or Delete buttons. Note that deleting an expense will affect all related balances.',
        },
        {
          question: 'How do recurring expenses work?',
          answer: 'Recurring expenses automatically create new expense entries based on your chosen frequency (daily, weekly, monthly, etc.). Set up a recurring expense once, and the app will handle the rest.',
        },
      ],
    },
    {
      category: 'Settlements',
      questions: [
        {
          question: 'How do I settle up with someone?',
          answer: 'Go to the Settlements page, find the person you want to settle with, and click "Settle Up". Choose your payment method and confirm the amount. Both parties will be notified.',
        },
        {
          question: 'What payment methods are supported?',
          answer: 'We support various payment methods including Venmo, PayPal, bank transfers, and cash. You can also mark payments as settled outside the app.',
        },
        {
          question: 'How do I view my balance history?',
          answer: 'Navigate to the Settlements page and click on the "History" tab to see all your past settlements and balance changes over time.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          question: 'How do I change my password?',
          answer: 'Go to your Profile or Settings page and click "Change Password". Enter your current password and new password, then confirm the change.',
        },
        {
          question: 'Is my financial data secure?',
          answer: 'Yes, we use industry-standard encryption to protect your data. All sensitive information is encrypted both in transit and at rest. We never share your personal information with third parties.',
        },
        {
          question: 'How do I delete my account?',
          answer: 'To delete your account, go to Settings > Data Management > Delete Account. Please note that this action is permanent and cannot be undone.',
        },
      ],
    },
  ];

  const helpCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'settlements', label: 'Settlements' },
    { value: 'account', label: 'Account & Security' },
  ];

  const resources = [
    { icon: <Book />, title: 'User Guide', description: 'Complete guide to using all features' },
    { icon: <VideoLibrary />, title: 'Video Tutorials', description: 'Step-by-step video walkthroughs' },
    { icon: <Description />, title: 'API Documentation', description: 'For developers and integrations' },
    { icon: <QuestionAnswer />, title: 'Community Forum', description: 'Get help from other users' },
  ];

  const filteredFaqs = faqs.filter(category => {
    if (selectedCategory === 'all') return true;
    return category.category.toLowerCase().includes(selectedCategory.toLowerCase());
  }).map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Help & Support
      </Typography>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                {helpCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* FAQs Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Help />
            Frequently Asked Questions
          </Typography>

          {filteredFaqs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No FAQs found matching your search. Try different keywords or browse all categories.
              </Typography>
            </Paper>
          ) : (
            filteredFaqs.map((category, categoryIndex) => (
              <Box key={categoryIndex} mb={3}>
                <Typography variant="h6" gutterBottom color="primary">
                  {category.category}
                </Typography>
                {category.questions.map((faq, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ))
          )}
        </Grid>

        {/* Contact and Resources */}
        <Grid item xs={12} md={4}>
          {/* Quick Contact */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Contact
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Support"
                    secondary="support@expensetracker.com"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Support"
                    secondary="1-800-EXPENSE"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Chat />
                  </ListItemIcon>
                  <ListItemText
                    primary="Live Chat"
                    secondary="Available 9 AM - 5 PM EST"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resources
              </Typography>
              <List>
                {resources.map((resource, index) => (
                  <ListItem button key={index}>
                    <ListItemIcon>{resource.icon}</ListItemIcon>
                    <ListItemText
                      primary={resource.title}
                      secondary={resource.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Popular Topics */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Popular Topics
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip label="Creating Groups" onClick={() => setSearchQuery('create group')} />
                <Chip label="Splitting Expenses" onClick={() => setSearchQuery('split')} />
                <Chip label="Settlements" onClick={() => setSearchQuery('settle')} />
                <Chip label="Recurring Expenses" onClick={() => setSearchQuery('recurring')} />
                <Chip label="Privacy" onClick={() => setSearchQuery('privacy')} />
                <Chip label="Security" onClick={() => setSearchQuery('security')} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contact Form */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactSupport />
            Contact Support
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
          </Typography>

          <form onSubmit={handleContactSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send />}
                  size="large"
                >
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpSupport;
