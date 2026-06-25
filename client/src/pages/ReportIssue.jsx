import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TNMap from '../components/TNMap';
import { 
  Camera, 
  Tag, 
  FileText, 
  MapPin, 
  Map, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle,
  EyeOff,
  X
} from 'lucide-react';

const ReportIssue = () => {
  const { user, t } = useAuth();
  const navigate = useNavigate();

  // Wizard Steps
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // GPS Coords
  const [location, setLocation] = useState({ lat: 11.127122, lng: 78.656894, address: '' }); // default TN

  // Geography collections
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [wards, setWards] = useState([]);

  // Chosen Geography IDs
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch initial districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await axios.get('/api/geography/districts');
        if (res.data.success) {
          setDistricts(res.data.districts);
        }
      } catch (e) {
        console.error('Failed to load districts', e);
      }
    };
    fetchDistricts();
  }, []);

  // 2. Fetch constituencies & panchayats when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setConstituencies([]);
      setPanchayats([]);
      setSelectedConstituency('');
      setSelectedPanchayat('');
      return;
    }

    const fetchDistrictData = async () => {
      try {
        const constRes = await axios.get(`/api/geography/constituencies/${selectedDistrict}`);
        if (constRes.data.success) {
          setConstituencies(constRes.data.constituencies);
        }
        
        const panRes = await axios.get(`/api/geography/panchayats/${selectedDistrict}`);
        if (panRes.data.success) {
          setPanchayats(req => panRes.data.panchayats);
        }
      } catch (e) {
        console.error('Failed to load district assets', e);
      }
    };
    fetchDistrictData();
  }, [selectedDistrict]);

  // 3. Fetch Wards when Panchayat changes
  useEffect(() => {
    if (!selectedPanchayat) {
      setWards([]);
      setSelectedWard('');
      return;
    }

    const fetchWards = async () => {
      try {
        const res = await axios.get(`/api/geography/wards/${selectedPanchayat}`);
        if (res.data.success) {
          setWards(res.data.wards);
        }
      } catch (e) {
        console.error('Failed to load wards', e);
      }
    };
    fetchWards();
  }, [selectedPanchayat]);

  // Handle image select
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Next / Prev Wizard controls
  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && !imageFile) {
      setErrorMsg('Please upload or capture a photograph of the issue.');
      return;
    }
    if (step === 2 && !category) {
      setErrorMsg('Please select a category for this issue.');
      return;
    }
    if (step === 3 && (!title.trim() || !description.trim())) {
      setErrorMsg('Please provide a title and detailed description.');
      return;
    }
    if (step === 4 && (!selectedDistrict || !selectedConstituency || !selectedPanchayat || !selectedWard)) {
      setErrorMsg('Please complete the full location hierarchy dropdown selection.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  // Submit report to Backend
  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
      formData.append('address', location.address || `${wards.find(w => w._id === selectedWard)?.name || 'Ward'}, ${panchayats.find(p => p._id === selectedPanchayat)?.name || 'Panchayat'}`);
      formData.append('districtId', selectedDistrict);
      formData.append('constituencyId', selectedConstituency);
      formData.append('panchayatId', selectedPanchayat);
      formData.append('wardId', selectedWard);
      formData.append('isAnonymous', isAnonymous);
      formData.append('isEmergency', isEmergency);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Configure token header manually since this is a multi-part form
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const res = await axios.post('/api/issues', formData, config);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setStep(7); // Show success screen
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDistrictName = () => districts.find(d => d._id === selectedDistrict)?.name || '';
  const getConstituencyName = () => constituencies.find(c => c._id === selectedConstituency)?.name || '';
  const getPanchayatName = () => panchayats.find(p => p._id === selectedPanchayat)?.name || '';
  const getWardName = () => wards.find(w => w._id === selectedWard)?.name || '';

  const stepsList = [
    { num: 1, name: 'Upload Photo', icon: Camera },
    { num: 2, name: 'Category', icon: Tag },
    { num: 3, name: 'Details', icon: FileText },
    { num: 4, name: 'Region', icon: MapPin },
    { num: 5, name: 'GPS Lock', icon: Map },
    { num: 6, name: 'Review', icon: CheckCircle }
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-12">
      {/* Wizard Progress bar */}
      {step <= 6 && (
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
            {stepsList.map(s => {
              const Icon = s.icon;
              const active = step >= s.num;
              const current = step === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    current 
                      ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 font-bold' 
                      : active 
                        ? 'bg-primary text-white font-bold' 
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[9px] font-bold mt-2 uppercase tracking-wide hidden sm:block ${
                    current ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {s.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-start space-x-2 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {/* STEP 1: UPLOAD PHOTO */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Upload Photograph</h3>
              <p className="text-xs text-slate-400 mt-1">Please provide a clear photo of the public infrastructure issue</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              {imagePreview ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-md">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Issue Preview" />
                  <button 
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-primary/50 dark:hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-6 bg-slate-50 dark:bg-slate-950">
                  <div className="bg-primary/10 rounded-2xl p-4 text-primary mb-3">
                    <Camera className="h-8 w-8" />
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-350">Click to upload photo</span>
                  <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WEBP (Max 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY SELECT */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Select Category</h3>
              <p className="text-xs text-slate-400 mt-1">Choose the category that best fits the reported problem</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                { val: 'pothole', label: 'Pothole / Road damage' },
                { val: 'garbage', label: 'Garbage dumping' },
                { val: 'streetlight', label: 'Broken streetlight' },
                { val: 'water_leakage', label: 'Water pipe leakage' },
                { val: 'sewage', label: 'Sewage overflow' },
                { val: 'road_damage', label: 'Encroachments' },
                { val: 'safety', label: 'Public safety concerns' },
                { val: 'other', label: 'Other complaints' }
              ].map(cat => {
                const active = category === cat.val;
                return (
                  <button
                    key={cat.val}
                    onClick={() => setCategory(cat.val)}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all text-left flex flex-col justify-between h-20 cursor-pointer ${
                      active 
                        ? 'border-primary bg-primary/5 text-primary dark:border-blue-500 dark:bg-blue-500/5 dark:text-blue-400 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Click to select</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: TITLE & DESCRIPTION */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Provide Details</h3>
              <p className="text-xs text-slate-400 mt-1">Give a concise title and a detailed description</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  Report Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Large pothole near Government Hospital road junction"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Provide precise details such as references, hazard descriptions, duration, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="low">Low (Minor inconvenience)</option>
                    <option value="medium">Medium (Standard priority)</option>
                    <option value="high">High (Major hazard)</option>
                    <option value="critical">Critical (Immediate danger)</option>
                  </select>
                </div>

                <div className="flex items-end pb-1 pl-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={isEmergency}
                      onChange={(e) => setIsEmergency(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-800 text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span className="text-red-500 flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Mark Emergency</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REGION SELECTION (TAMIL NADU HIERARCHY) */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Location Administration</h3>
              <p className="text-xs text-slate-400 mt-1">Link your report to the local government hierarchy</p>
            </div>

            <div className="space-y-4">
              {/* District */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  1. District / மாவட்டம்
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedConstituency('');
                    setSelectedPanchayat('');
                    setSelectedWard('');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Constituency */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  2. Assembly Constituency / சட்டமன்ற தொகுதி
                </label>
                <select
                  value={selectedConstituency}
                  disabled={!selectedDistrict}
                  onChange={(e) => setSelectedConstituency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Constituency</option>
                  {constituencies.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Panchayat */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  3. Panchayat Union / Corporation / நகராட்சி
                </label>
                <select
                  value={selectedPanchayat}
                  disabled={!selectedDistrict}
                  onChange={(e) => {
                    setSelectedPanchayat(e.target.value);
                    setSelectedWard('');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Panchayat Union / Municipality</option>
                  {panchayats.map(p => (
                    <option key={p._id} value={p._id}>{p.unionName} - {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  4. Ward / Village Panchayat / வார்டு
                </label>
                <select
                  value={selectedWard}
                  disabled={!selectedPanchayat}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Ward / Village</option>
                  {wards.map(w => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: GPS LOCATION PICKER */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Pinpoint GPS Coordinate</h3>
              <p className="text-xs text-slate-400 mt-1">Drag the marker or click on the map to pinpoint the exact location</p>
            </div>

            <div className="space-y-4">
              <TNMap 
                interactive={true} 
                onLocationSelect={(coords) => setLocation(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))} 
                initialLocation={{ lat: location.lat, lng: location.lng }}
                zoom={14}
                height="320px"
              />

              <div className="grid grid-cols-2 gap-4 text-center bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl text-[10px] text-slate-500 font-mono">
                <div>Latitude: {location.lat.toFixed(6)}</div>
                <div>Longitude: {location.lng.toFixed(6)}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 pl-1">
                  Address Details (Optional landmarks)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite to Post Office, Ward Street"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & SUBMIT */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">Review Report</h3>
              <p className="text-xs text-slate-400 mt-1">Please double check details before submitting to authority</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
              
              {/* Image preview */}
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 shadow-inner">
                {imagePreview && <img src={imagePreview} className="w-full h-full object-cover" alt="Selected Issue" />}
              </div>

              {/* Data list */}
              <div className="space-y-2">
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Title:</span> {title}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Category:</span> <span className="capitalize">{category}</span></div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Severity:</span> <span className="capitalize font-semibold text-amber-500">{severity}</span></div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">District:</span> {getDistrictName()}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Constituency:</span> {getConstituencyName()}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Panchayat:</span> {getPanchayatName()}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Ward/Village:</span> {getWardName()}</div>
                <div><span className="font-bold text-slate-800 dark:text-slate-350">Coords:</span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-3 pt-3">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 select-none bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="flex items-center space-x-1.5">
                  <EyeOff className="h-4 w-4 text-slate-400" />
                  <span>Report Anonymously (Hide my profile publicly)</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 7: SUCCESS SPLASH SCREEN */}
        {step === 7 && (
          <div className="text-center py-8 space-y-6">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto scale-110">
              <CheckCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Submission Successful!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {successMsg || 'Your report has been received and logged in MongoDB Atlas.'}
              </p>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 p-4 rounded-2xl max-w-md mx-auto text-xs leading-normal">
              <strong>Admin Verification Workflow Notice:</strong> To maintain community integrity, this report is temporarily hidden from the public map and community feeds. It is currently visible only to state administrators. Once verified, it will instantly go live for all citizens and be open for upvotes and progress tracking.
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => navigate('/my-reports')}
                className="bg-primary hover:bg-primary/95 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer"
              >
                Go to My Reports
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        )}

        {/* BUTTON CONTROLS (Footer of wizard) */}
        {step <= 6 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-colors py-2 px-3 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 6 ? (
              <button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all flex items-center space-x-1.5 shadow-md shadow-primary/10 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportIssue;
