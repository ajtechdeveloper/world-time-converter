'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Plus, Trash2 } from 'lucide-react';

const WorldTimeConverter = () => {
  const [sourceCity, setSourceCity] = useState('');
  const [sourceTime, setSourceTime] = useState('');
  const [destinations, setDestinations] = useState([{ city: '', time: '', date: '' }]);
  const [loading, setLoading] = useState(false);

  const cities = [
    { name: 'Amsterdam', timezone: 'Europe/Amsterdam' },
    { name: 'Bangalore', timezone: 'Asia/Kolkata' },
    { name: 'Bangkok', timezone: 'Asia/Bangkok' },
    { name: 'Barcelona', timezone: 'Europe/Madrid' },
    { name: 'Beijing', timezone: 'Asia/Shanghai' },
    { name: 'Berlin', timezone: 'Europe/Berlin' },
    { name: 'Chicago', timezone: 'America/Chicago' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
    { name: 'Dublin', timezone: 'Europe/Dublin' },
    { name: 'Frankfurt', timezone: 'Europe/Berlin' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { name: 'Istanbul', timezone: 'Europe/Istanbul' },
    { name: 'Jakarta', timezone: 'Asia/Jakarta' },
    { name: 'Johannesburg', timezone: 'Africa/Johannesburg' },
    { name: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { name: 'Madrid', timezone: 'Europe/Madrid' },
    { name: 'Melbourne', timezone: 'Australia/Melbourne' },
    { name: 'Mexico City', timezone: 'America/Mexico_City' },
    { name: 'Milan', timezone: 'Europe/Rome' },
    { name: 'Moscow', timezone: 'Europe/Moscow' },
    { name: 'Mumbai', timezone: 'Asia/Kolkata' },
    { name: 'New Delhi', timezone: 'Asia/Kolkata' },
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'Paris', timezone: 'Europe/Paris' },
    { name: 'Rome', timezone: 'Europe/Rome' },
    { name: 'San Francisco', timezone: 'America/Los_Angeles' },
    { name: 'São Paulo', timezone: 'America/Sao_Paulo' },
    { name: 'Seoul', timezone: 'Asia/Seoul' },
    { name: 'Shanghai', timezone: 'Asia/Shanghai' },
    { name: 'Singapore', timezone: 'Asia/Singapore' },
    { name: 'Stockholm', timezone: 'Europe/Stockholm' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Toronto', timezone: 'America/Toronto' },
    { name: 'Vancouver', timezone: 'America/Vancouver' },
    { name: 'Vienna', timezone: 'Europe/Vienna' },
    { name: 'Warsaw', timezone: 'Europe/Warsaw' },
    { name: 'Zurich', timezone: 'Europe/Zurich' },
    { name: 'San Jose', timezone: 'America/Los_Angeles' },
    { name: 'Atlanta', timezone: 'America/New_York' },
    { name: 'Tel Aviv', timezone: 'Asia/Tel_Aviv' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  // Generate time options (00:00 to 23:30 with 30-minute intervals)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0');
    const minutes = (i % 2 === 0 ? '00' : '30');
    return `${hours}:${minutes}`;
  });

  // Update useEffect to only run when source city or time changes
  useEffect(() => {
    if (sourceCity && sourceTime) {
      // Only convert for destinations that have a city selected
      destinations.forEach((dest, index) => {
        if (dest.city && !dest.time) {
          convertTime(dest.city, index);
        }
      });
    }
  }, [destinations.length]); // Only run when destinations array length changes

  const convertTime = async (destCity, index) => {
    if (!sourceCity || !destCity || !sourceTime) {
      updateDestinationTime(index, '', '');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [hours, minutes] = sourceTime.split(':');
      const sourceDateTime = `${today} ${hours}:${minutes}:00`;

      const sourceCityObj = cities.find(c => c.name === sourceCity);
      const destCityObj = cities.find(c => c.name === destCity);

      if (!sourceCityObj || !destCityObj) {
        throw new Error("Invalid city selected");
      }

      const response = await fetch('https://timeapi.io/api/conversion/converttimezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTimeZone: sourceCityObj.timezone,
          dateTime: sourceDateTime,
          toTimeZone: destCityObj.timezone,
          dstAmbiguity: ""
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error converting time. Response:", errorText);
        throw new Error('Failed to convert time');
      }

      const data = await response.json();
      if (!data.conversionResult) {
        throw new Error("Invalid response from time conversion API");
      }
      
      // Get the source and destination dates to compare
      const sourceDate = new Date(sourceDateTime);
      const destDate = new Date(data.conversionResult.dateTime);
      
      // Calculate day difference
      const dayDiff = destDate.getDate() - sourceDate.getDate();
      let dayIndicator = '';
      if (dayDiff === 1 || (dayDiff === -30 && destDate > sourceDate)) {
        dayIndicator = ' (Next Day)';
      } else if (dayDiff === -1 || (dayDiff === 30 && destDate < sourceDate)) {
        dayIndicator = ' (Previous Day)';
      }
      
      updateDestinationTime(index, data.conversionResult.time, dayIndicator);
    } catch (error) {
      console.error('Error converting time:', error);
      updateDestinationTime(index, 'Error converting time', '');
    } finally {
      setLoading(false);
    }
  };

  const updateDestinationTime = (index, time, date) => {
    setDestinations(prev => prev.map((dest, i) => 
      i === index ? { ...dest, time, date } : dest
    ));
  };

  const handleSourceCityChange = (value) => {
    setSourceCity(value);
    // Clear all destination times before recalculating
    setDestinations(prev => prev.map(dest => ({ ...dest, time: '', date: '' })));
    
    // Use the new city value directly instead of sourceCity state
    if (value && sourceTime) {
      destinations.forEach((dest, index) => {
        if (dest.city) {
          convertTimeWithCity(value, dest.city, index);
        }
      });
    }
  };

  const handleSourceTimeChange = (value) => {
    setSourceTime(value);
    // Clear all destination times before recalculating
    setDestinations(prev => prev.map(dest => ({ ...dest, time: '', date: '' })));
    
    // Use the new time value directly instead of sourceTime state
    if (sourceCity && value) {
      destinations.forEach((dest, index) => {
        if (dest.city) {
          convertTimeWithTime(dest.city, index, value);
        }
      });
    }
  };

  // Add a new function that accepts the time parameter
  const convertTimeWithTime = async (destCity, index, newTime) => {
    if (!sourceCity || !destCity || !newTime) {
      updateDestinationTime(index, '', '');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [hours, minutes] = newTime.split(':');
      const sourceDateTime = `${today} ${hours}:${minutes}:00`;

      // Rest of the conversion logic remains the same
      const sourceCityObj = cities.find(c => c.name === sourceCity);
      const destCityObj = cities.find(c => c.name === destCity);

      if (!sourceCityObj || !destCityObj) {
        throw new Error("Invalid city selected");
      }

      const response = await fetch('https://timeapi.io/api/conversion/converttimezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTimeZone: sourceCityObj.timezone,
          dateTime: sourceDateTime,
          toTimeZone: destCityObj.timezone,
          dstAmbiguity: ""
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error converting time. Response:", errorText);
        throw new Error('Failed to convert time');
      }

      const data = await response.json();
      if (!data.conversionResult) {
        throw new Error("Invalid response from time conversion API");
      }
      
      // Get the source and destination dates to compare
      const sourceDate = new Date(sourceDateTime);
      const destDate = new Date(data.conversionResult.dateTime);
      
      // Calculate day difference
      const dayDiff = destDate.getDate() - sourceDate.getDate();
      let dayIndicator = '';
      if (dayDiff === 1 || (dayDiff === -30 && destDate > sourceDate)) {
        dayIndicator = ' (Next Day)';
      } else if (dayDiff === -1 || (dayDiff === 30 && destDate < sourceDate)) {
        dayIndicator = ' (Previous Day)';
      }
      
      updateDestinationTime(index, data.conversionResult.time, dayIndicator);
    } catch (error) {
      console.error('Error converting time:', error);
      updateDestinationTime(index, 'Error converting time', '');
    } finally {
      setLoading(false);
    }
  };

  // Add a new function that accepts the source city parameter
  const convertTimeWithCity = async (newSourceCity, destCity, index) => {
    if (!newSourceCity || !destCity || !sourceTime) {
      updateDestinationTime(index, '', '');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [hours, minutes] = sourceTime.split(':');
      const sourceDateTime = `${today} ${hours}:${minutes}:00`;

      const sourceCityObj = cities.find(c => c.name === newSourceCity);
      const destCityObj = cities.find(c => c.name === destCity);

      if (!sourceCityObj || !destCityObj) {
        throw new Error("Invalid city selected");
      }

      const response = await fetch('https://timeapi.io/api/conversion/converttimezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTimeZone: sourceCityObj.timezone,
          dateTime: sourceDateTime,
          toTimeZone: destCityObj.timezone,
          dstAmbiguity: ""
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error converting time. Response:", errorText);
        throw new Error('Failed to convert time');
      }

      const data = await response.json();
      if (!data.conversionResult) {
        throw new Error("Invalid response from time conversion API");
      }
      
      // Get the source and destination dates to compare
      const sourceDate = new Date(sourceDateTime);
      const destDate = new Date(data.conversionResult.dateTime);
      
      // Calculate day difference
      const dayDiff = destDate.getDate() - sourceDate.getDate();
      let dayIndicator = '';
      if (dayDiff === 1 || (dayDiff === -30 && destDate > sourceDate)) {
        dayIndicator = ' (Next Day)';
      } else if (dayDiff === -1 || (dayDiff === 30 && destDate < sourceDate)) {
        dayIndicator = ' (Previous Day)';
      }
      
      updateDestinationTime(index, data.conversionResult.time, dayIndicator);
    } catch (error) {
      console.error('Error converting time:', error);
      updateDestinationTime(index, 'Error converting time', '');
    } finally {
      setLoading(false);
    }
  };

  const handleDestCityChange = (value, index) => {
    // Clear the time for this destination before recalculating
    setDestinations(prev => prev.map((dest, i) => 
      i === index 
        ? { city: value, time: '', date: '' }
        : dest
    ));
    
    // Only convert time for the changed destination
    if (sourceCity && sourceTime && value) {
      convertTime(value, index);
    }
  };

  const addDestination = () => {
    setDestinations(prev => [...prev, { city: '', time: '', date: '' }]);
    // No need to trigger any conversion here
  };

  const removeDestination = (index) => {
    setDestinations(prev => prev.filter((_, i) => i !== index));
    // No need to trigger any conversion here
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 bg-gradient-to-br from-white to-gray-50 shadow-xl border-t-4 border-t-blue-500">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          World Time Converter
        </CardTitle>
        <p className="text-gray-500 text-center text-sm">Convert time across different cities worldwide</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <MapPin className="w-4 h-4" />
              Source City
            </Label>
            <Select value={sourceCity} onValueChange={handleSourceCityChange}>
              <SelectTrigger className="bg-white shadow-sm border-gray-200 hover:border-blue-400 transition-colors">
                <SelectValue placeholder="Select source city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Clock className="w-4 h-4" />
              Source Time
            </Label>
            <Select value={sourceTime} onValueChange={handleSourceTimeChange}>
              <SelectTrigger className="bg-white shadow-sm border-gray-200 hover:border-blue-400 transition-colors">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time}>
                    {time} HRS
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {destinations.map((dest, index) => (
          <div 
            key={index} 
            className="space-y-3 border border-gray-200 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <MapPin className="w-4 h-4 text-purple-500" />
                Destination City {index + 1}
              </Label>
              {destinations.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeDestination(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select 
              value={dest.city} 
              onValueChange={(value) => handleDestCityChange(value, index)}
            >
              <SelectTrigger className="bg-white shadow-sm border-gray-200 hover:border-purple-400 transition-colors">
                <SelectValue placeholder="Select destination city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Clock className="w-4 h-4 text-purple-500" />
                Time
              </Label>
            </div>
            <div className={`p-3 rounded-lg text-center font-medium ${
              dest.time 
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-700' 
                : 'bg-gray-50 text-gray-500'
            }`}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </div>
              ) : (
                dest.time 
                  ? <span className="text-lg">{dest.time}<span className="text-purple-600">{dest.date}</span></span>
                  : 'Select cities and time'
              )}
            </div>
          </div>
        ))}

        <Button 
          type="button" 
          onClick={addDestination}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-white font-medium py-2 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Destination
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorldTimeConverter;
