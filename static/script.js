document.getElementById('carForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  try {
    const res = await fetch('/submit', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    alert(result.message);
    this.reset(); // Clear form
  } catch (err) {
    alert('Failed to save car details.');
  }
});
