document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // Get the calculate button element
    const calculateButton = document.getElementById('calculate-button');
    if (!calculateButton) {
        console.error("Calculate button not found!");
        return;
    }

    // Add click event listener to the calculate button
    calculateButton.addEventListener('click', (event) => {
        event.preventDefault();  // Prevent the default action of the anchor link
        console.log('Calculate button clicked.');

        // Additional action to show that the button works
        alert('Calculate button was clicked!');
    });
});
