import React, { useState, useEffect, useRef } from 'react';
import Popup from './popup';
import Select from 'react-select';
import { Link } from 'react-router-dom';

export default () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [eventUri, setEventUri] = useState(null);
  const [reasonInput, setReasonInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('all-events');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageToken, setPrevPageToken] = useState(null);
  const [paginationCount, setPaginationCount] = useState(0);

  const currentDateMillisec = Date.now();

  const options = [
    { value: 'all-events', label: 'All Events' },
    { value: 'active-events', label: 'Active Events' },
    { value: 'canceled-events', label: 'Canceled Events' },
  ];

  const fetchData = async () => {
    let nextPageQueryParams = '?';

    if (nextPageToken) nextPageQueryParams += `&page_token=${nextPageToken}`;

    if (prevPageToken) {
      nextPageQueryParams = '?';
      nextPageQueryParams += `&page_token=${prevPageToken}`;
    }

    if (selectedOption === 'active-events') {
      nextPageQueryParams += '&status=active';

      const result = await fetch(
        `/api/scheduled_events${nextPageQueryParams}`
      ).then((res) => res.json());

      setEvents([...result.events]);
      setPagination(result.pagination);
      return;
    }

    if (selectedOption === 'canceled-events') {
      nextPageQueryParams += '&status=canceled';

      const result = await fetch(
        `/api/scheduled_events${nextPageQueryParams}`
      ).then((res) => res.json());

      setEvents([...result.events]);
      setPagination(result.pagination);
      return;
    } else {
      const result = await fetch(
        `/api/scheduled_events${nextPageQueryParams}`
      ).then((res) => res.json());

      setEvents([...result.events]);
      setPagination(result.pagination);
    }
  };

  const handleCancellation = async (event) => {
    event.preventDefault();

    const uuid = event.target.value.split('/')[4];

    const body = await JSON.stringify({ reason: reasonInput });

    await fetch(`/api/cancel_event/${uuid}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body,
    }).then((res) => res.json());

    window.alert('Event canceled successfully!');
    window.location.reload();
  };

  const togglePopup = (event) => {
    setPopupOpen(!popupOpen);
    setEventUri(event.target.value);
    setReasonInput('');
  };

  const handleSelectedOptionChange = (value) => {
    setPaginationCount(0);
    setNextPageToken(false);
    setPrevPageToken(false);
    setSelectedOption(value);
    setEvents([]);
  };

  useEffect(() => {
    fetchData();
  }, [selectedOption, nextPageToken, prevPageToken]);

  return (
    <div className="container" style={{ marginTop: '50px' }}>
      <div style={{ alignSelf: 'center', textAlign: 'center' }}>
        <Select
          defaultValue={selectedOption}
          options={options}
          placeholder="Choose Filter"
          onChange={(event) => handleSelectedOptionChange(event.value)}
        />
      </div>
      <div className="row">
        <table className="striped centered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.uri}>
                <td>
                  <Link to={`/events/${event.uri.split('/')[4]}`}>
                    {event.name}
                  </Link>
                </td>
                <td>{event.date}</td>
                <td>{event.start_time_formatted}</td>
                <td>{event.end_time_formatted}</td>
                <td>{event.status && event.status.toUpperCase()}</td>
                {currentDateMillisec < Date.parse(event.start_time) &&
                  event.status === 'active' && (
                    <td>
                      <button
                        className="toggle-btn"
                        value={event.uri}
                        onClick={togglePopup}
                      >
                        Cancel Event
                      </button>
                    </td>
                  )}

                {popupOpen && event.uri === eventUri && (
                  <Popup
                    content={
                      <form>
                        <label>
                          <h5>Cancel Event</h5>
                          <h6>"{event.name}"</h6>
                          <h6>{event.date}</h6>
                          <h6>
                            {event.start_time_formatted}-
                            {event.end_time_formatted}
                          </h6>
                          Reason:
                          <textarea
                            type="text"
                            value={reasonInput}
                            onChange={(event) =>
                              setReasonInput(event.target.value)
                            }
                          />
                        </label>
                        <button value={event.uri} onClick={handleCancellation}>
                          Yes, cancel
                        </button>
                      </form>
                    }
                    handleClose={togglePopup}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.next_page_token && (
        <div className="next-back-btns">
          <button
            className="waves-effect waves-light btn-small"
            onClick={() => {
              setPaginationCount(paginationCount + 1);
              setNextPageToken(pagination.next_page_token);
              setPrevPageToken(false);
            }}
          >
            Show Next
          </button>
        </div>
      )}
      {paginationCount > 0 && !popupOpen && (
        <div className="next-back-btns">
          <button
            className="waves-effect waves-light btn-small"
            onClick={() => {
              setPaginationCount(paginationCount - 1);
              setPrevPageToken(pagination.previous_page_token);
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};
