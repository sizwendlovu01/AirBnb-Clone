import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccommodation, updateAccommodation } from '../../api/accommodationApi';
import ListingForm from '../../components/admin/ListingForm.jsx';
import Spinner from '../../components/common/Spinner.jsx';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getAccommodation(id)
      .then(setListing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload) {
    setServerError('');
    try {
      setSubmitting(true);
      await updateAccommodation(id, payload);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!listing) return null;

  return (
    <div>
      <h1>Edit listing</h1>
      <ListingForm
        initialValues={{
          title: listing.title,
          location: listing.location,
          description: listing.description,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          guests: listing.guests,
          type: listing.type,
          price: listing.price,
          amenities: (listing.amenities || []).join(', '),
          weeklyDiscount: listing.weeklyDiscount,
          cleaningFee: listing.cleaningFee,
          serviceFee: listing.serviceFee,
          occupancyTaxes: listing.occupancyTaxes,
          enhancedCleaning: listing.enhancedCleaning,
          selfCheckIn: listing.selfCheckIn,
        }}
        existingImages={listing.images || []}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
        serverError={serverError}
      />
    </div>
  );
}
