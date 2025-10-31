'use client';

import "./dashboard.css";

import { APIList } from "../../components/api-list";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useState, useEffect, useCallback } from 'react';

export default function DashboardPage() {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    marketplace: 0,
    personal: 0,
    categories: 0,
  });

  const handleStatsChange = useCallback((nextStats) => {
    setStats(nextStats);
  }, []);

  useEffect(() => {
    if (user) {
      // Clear any previous errors
      setError(null);

      const loadUser = async () => {
        try {
          console.log('Loading user data for:', user.id);
          console.log('User object:', user);
          console.log('User email:', user.primaryEmailAddress?.emailAddress);

          // Call backend directly
          const API_URL = 'https://enigma.shubh.sh';

          // First try to get existing user
          const getUserResponse = await fetch(`${API_URL}/users/clerk/${user.id}`);
          console.log('Get user response:', getUserResponse.status, getUserResponse.statusText);

          if (getUserResponse.ok) {
            const existingUser = await getUserResponse.json();
            console.log('Found existing user:', existingUser);
            setDbUser(existingUser);
          } else {
            // If user doesn't exist, create them
            console.log('User not found, creating new user...');
            const userData = await fetch(`${API_URL}/users/clerk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clerk_id: user.id,
                name: user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.username || 'User',
                email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress,
              }),
            });

            console.log('Create user response:', userData.status);

            if (userData.ok) {
              const userResponse = await userData.json();
              console.log('Created new user:', userResponse);
              setDbUser(userResponse);
            } else {
              const errorText = await userData.text();
              console.error('Failed to create user:', userData.status, errorText);

              // One more attempt to get existing user in case creation failed due to duplicate
              console.log('Trying to get existing user one more time...');
              const finalGetResponse = await fetch(`${API_URL}/users/clerk/${user.id}`);
              if (finalGetResponse.ok) {
                const existingUser = await finalGetResponse.json();
                console.log('Found existing user on second attempt:', existingUser);
                setDbUser(existingUser);
              } else {
                throw new Error(`Failed to create or retrieve user: ${userData.status} - ${errorText}`);
              }
            }
          }
        } catch (err) {
          console.error('Error loading user:', err);
          setError(err.message || 'Failed to load user data');

          // Fallback to mock user data if database fails
          console.log('Falling back to mock user data');
          const mockUser = {
            id: user.id,
            external_id: user.id,
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.username || 'User',
            email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress,
          };
          setDbUser(mockUser);
        } finally {
          setLoading(false);
        }
      };

      loadUser();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="error-message">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="error-title">Error loading your profile</h2>
          <p className="error-text">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-header-left">
            <Link href="/" className="dashboard-back-button">
              <ArrowLeft className="dashboard-back-icon" />
              Back home
            </Link>
            <div className="dashboard-header-text">
              <h1 className="dashboard-header-greeting">
                Welcome, {dbUser?.name || user?.firstName || user?.username || 'Creator'}
              </h1>
            </div>
          </div>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "dashboard-header-avatarBox",
                  userButtonPopoverFooter: "hidden",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
        </div>
      </div>

      {/* Stats Section */}
      <div className="dashboard-stats-wrapper">
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Marketplace APIs</span>
            <span className="dashboard-stat-value">{stats.marketplace}</span>
            <span className="dashboard-stat-foot">Live in the marketplace</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Your APIs</span>
            <span className="dashboard-stat-value">{stats.personal}</span>
            <span className="dashboard-stat-foot">Owned by you</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Active categories</span>
            <span className="dashboard-stat-value">{stats.categories}</span>
            <span className="dashboard-stat-foot">Unique specialisations</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="api-marketplace" className="api-marketplace-section px-4 sm:px-6 lg:px-8 py-12">
        <APIList userId={dbUser.id} onStatsChange={handleStatsChange} />
      </div>
    </div>
  );
}
