import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './UserProfile.css';
import { FaUserCircle } from 'react-icons/fa';

const UserProfile = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div className="user-profile-container" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="profile-trigger">
                <FaUserCircle size={28} />
            </button>

            {isOpen && (
                <div className="profile-dropdown">
                    <ul>
                        <li onClick={() => navigate('/')}>Home</li>
                        <li onClick={() => alert('Profile page not implemented yet!')}>Profile</li>
                        <li onClick={handleLogout}>Log Out</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserProfile;