import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAccommodation } from '../../api/accommodationApi';
import ListingForm from '../../components/admin/ListingForm.jsx';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  async function handleSubmit(payload) {
    setServerError('');
    try {
      setSubmitting(true);
      await createAccommodation(payload);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Create a new listing</h1>
      <ListingForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Publish listing"
        serverError={serverError}
      />
    </div>
  );
}
