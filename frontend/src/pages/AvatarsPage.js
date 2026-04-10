import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await axios.get(`${API_URL}/avatars`);
      setAvatars(response.data.avatars);
    } catch (error) {
      toast.error('Failed to load avatars');
      console.error('Error fetching avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedAvatar) {
      navigate('/dashboard/create', { state: { avatar: selectedAvatar } });
    } else {
      toast.error('Please select an avatar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">
          Choose Your AI Host
        </h1>
        <p className="text-lg text-slate-600">
          Make custom AI generated avatar videos in minutes.
        </p>
      </div>

      {/* Horizontal Scroll Avatars */}
      <div className="relative mb-8">
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
          {avatars.map((avatar, index) => {
            const isSelected = selectedAvatar?.avatar_id === avatar.avatar_id;
            return (
              <motion.div
                key={avatar.avatar_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 snap-start"
              >
                <Card
                  data-testid={`avatar-card-${avatar.avatar_id}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative group cursor-pointer transition-all duration-300 overflow-hidden w-72 ${
                    isSelected
                      ? 'ring-4 ring-primary shadow-2xl scale-105'
                      : 'hover:shadow-xl hover:scale-102 border-slate-200'
                  }`}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-100">
                    <img
                      src={avatar.preview_image_url || avatar.image_url}
                      alt={avatar.display_name || avatar.avatar_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                          <Check className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-heading font-semibold text-slate-900 mb-1">
                      {avatar.display_name || avatar.avatar_name}
                    </h3>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      {selectedAvatar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            data-testid="next-step-button"
            onClick={handleNext}
            size="lg"
            className="bg-secondary hover:bg-secondary/90 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-red-900/20 gap-2"
          >
            Next Step
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}