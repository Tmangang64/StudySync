import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ArrowLeft, CheckCircle2, MapPin, Users, User, Clock, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type StudyMode = 'alone' | 'buddy' | null;
type CheckInStep = 'confirm' | 'details' | 'location' | 'success';

export function CheckIn() {
  const navigate = useNavigate();
  const { addSession } = useAppContext();
  
  const [step, setStep] = useState<CheckInStep>('confirm');
  const [studyMode, setStudyMode] = useState<StudyMode>(null);
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(45);
  const [isStarting, setIsStarting] = useState(false);

  const locationOptions = ['Library', 'Home', 'Coffee Shop', 'Study Hall', 'Dorm Room'];
  const durationOptions = [25, 45, 60, 90];

  // Mock upcoming session
  const upcomingSession = {
    subject: 'Calculus II',
    time: '4:00 PM',
    topic: 'Chapter 5 Review',
  };

  const handleStartNow = () => {
    setStep('details');
  };

  const handleContinue = () => {
    if (step === 'details' && studyMode) {
      setStep('location');
    } else if (step === 'location' && location) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsStarting(true);
    
    setTimeout(() => {
      addSession({
        course: upcomingSession.subject,
        topic: upcomingSession.topic,
        type: studyMode || "solo",
        time: upcomingSession.time,
        duration: duration,
        date: new Date().toISOString().split('T')[0],
        status: "completed",
      });

      setStep('success');
      setIsStarting(false);

      setTimeout(() => {
        navigate('/');
      }, 3000);
    }, 1000);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-6">
        <Card className="p-8 max-w-md w-full shadow-2xl text-center bg-white">
          <div className="bg-green-500 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You're Checked In! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {duration} minutes of focused study time started
          </p>
          
          {/* Progress Ring */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#10B981"
                strokeWidth="8"
                fill="none"
                strokeDasharray="440"
                strokeDashoffset="0"
                className="animate-pulse"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{duration}</div>
                <div className="text-sm text-gray-600">minutes</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Stay focused. You've got this! 💪
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="hover:bg-white/10 rounded-lg p-2 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Check In</h1>
        </div>
        <p className="text-blue-100 text-sm ml-14">
          Let's get you started
        </p>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {step === 'confirm' && (
          <>
            {/* Session Reminder */}
            <Card className="p-6 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 rounded-full p-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">Upcoming Session</h2>
                  <p className="text-sm text-gray-600">{upcomingSession.time}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">{upcomingSession.subject}</div>
                <div className="text-sm text-gray-600">{upcomingSession.topic}</div>
              </div>
            </Card>

            {/* Are you starting now? */}
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Are you starting now?
              </h3>
              
              <Button
                onClick={handleStartNow}
                className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg shadow-lg hover:shadow-xl transition-all mb-3"
              >
                <Play className="w-6 h-6 mr-2" />
                Yes, Let's Start!
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full h-12"
              >
                Not Yet
              </Button>
            </Card>
          </>
        )}

        {step === 'details' && (
          <>
            {/* Study Mode Selection */}
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Who are you studying with?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose your study mode for this session
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStudyMode('alone')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    studyMode === 'alone'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-3 ${
                      studyMode === 'alone' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <User className={`w-6 h-6 ${
                        studyMode === 'alone' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Studying Alone</div>
                      <div className="text-sm text-gray-600">Solo focus session</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStudyMode('buddy')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    studyMode === 'buddy'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-3 ${
                      studyMode === 'buddy' ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <Users className={`w-6 h-6 ${
                        studyMode === 'buddy' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">With Study Buddy</div>
                      <div className="text-sm text-gray-600">Accountability partner</div>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Duration Selection */}
            <Card className="p-6 shadow-lg">
              <Label className="text-base font-semibold mb-4 block">
                How long will you study?
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {durationOptions.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDuration(mins)}
                    className={`py-4 rounded-lg font-semibold transition-all ${
                      duration === mins
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </Card>

            <Button
              onClick={handleContinue}
              disabled={!studyMode}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              Continue
            </Button>
          </>
        )}

        {step === 'location' && (
          <>
            {/* Location Selection */}
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Where are you studying?
                </h3>
              </div>

              <div className="space-y-2">
                {locationOptions.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                      location === loc
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </Card>

            <Button
              onClick={handleContinue}
              disabled={!location || isStarting}
              className="w-full h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isStarting ? (
                'Starting Session...'
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Start My Session
                </>
              )}
            </Button>
          </>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {['confirm', 'details', 'location'].map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? 'w-8 bg-blue-600'
                  : ['confirm', 'details', 'location'].indexOf(step) > i
                  ? 'w-2 bg-blue-600'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
