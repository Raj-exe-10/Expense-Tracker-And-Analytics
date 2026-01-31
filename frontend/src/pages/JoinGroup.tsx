import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import { Group as GroupIcon, CheckCircle, Error } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { joinByCode } from '../store/slices/groupSlice';

const JoinGroup: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<any>(null);

  // If not logged in, redirect to login with return URL
  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/groups/join/${inviteCode}`);
    }
  }, [user, inviteCode, navigate]);

  const handleJoinGroup = async () => {
    if (!inviteCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await dispatch(joinByCode(inviteCode)).unwrap();
      setSuccess(true);
      setJoinedGroup(result.group);
    } catch (err: any) {
      setError(err || 'Failed to join group. The invite code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToGroup = () => {
    navigate('/groups');
  };

  if (!user) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="80vh"
      p={3}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          {/* Success State */}
          {success && joinedGroup && (
            <>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'success.main',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CheckCircle sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Welcome to the group!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                You've successfully joined <strong>{joinedGroup.name}</strong>
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGoToGroup}
                fullWidth
              >
                Go to Groups
              </Button>
            </>
          )}

          {/* Error State */}
          {error && (
            <>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'error.main',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Error sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Unable to Join
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/groups')}
                  fullWidth
                >
                  Go to Groups
                </Button>
                <Button
                  variant="contained"
                  onClick={handleJoinGroup}
                  fullWidth
                >
                  Try Again
                </Button>
              </Box>
            </>
          )}

          {/* Initial State */}
          {!success && !error && (
            <>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <GroupIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Join a Group
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={1}>
                You've been invited to join a group!
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Invite code: <strong>{inviteCode}</strong>
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleJoinGroup}
                disabled={loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <GroupIcon />}
              >
                {loading ? 'Joining...' : 'Join Group'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default JoinGroup;
