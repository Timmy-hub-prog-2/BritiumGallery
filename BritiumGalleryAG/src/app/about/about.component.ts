import { Component, OnInit } from '@angular/core';
import { AboutService } from '../about.service';
import Swal from 'sweetalert2';

export interface About {
  id?: number;
  mission: string;
  vision: string;
  story: string;
  valueText: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  aboutList: About[] = [];
  formAbout: About = { mission: '', vision: '', story: '', valueText: '', imageUrl: '' };
  editingAbout: About | null = null;
  selectedImage: File | null = null;

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.loadAbouts();
  }

  loadAbouts() {
    this.aboutService.getAll().subscribe(data => {
      this.aboutList = data;
    });
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }

  saveAbout() {
    if (!this.formAbout.mission.trim() || !this.formAbout.vision.trim() ||
        !this.formAbout.story.trim() || !this.formAbout.valueText.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all fields before saving.',
        confirmButtonColor: '#222'
      });
      return;
    }

    // Send the form data, including the image if available
    this.submitAbout();
  }

submitAbout() {
  const formData = new FormData();
  
  // Append each form field as individual form data entries
  formData.append('mission', this.formAbout.mission);
  formData.append('vision', this.formAbout.vision);
  formData.append('story', this.formAbout.story);
  formData.append('valueText', this.formAbout.valueText);
  
  if (this.selectedImage) {
    formData.append('file', this.selectedImage, this.selectedImage.name);
  }

  // Handle create or update operation
  if (this.editingAbout) {
    this.aboutService.update(this.editingAbout.id!, formData).subscribe(() => {
      this.editingAbout = null;
      this.resetForm();
      this.loadAbouts();
    });
  } else {
    this.aboutService.create(formData).subscribe(() => {
      this.resetForm();
      this.loadAbouts();
    });
  }
}

  editAbout(about: About) {
    this.editingAbout = about;
    this.formAbout = { ...about };
  }

  deleteAbout(id: number) {
    if (confirm('Are you sure you want to delete this About section?')) {
      this.aboutService.delete(id).subscribe(() => this.loadAbouts());
    }
  }

  cancelEdit() {
    this.editingAbout = null;
    this.resetForm();
  }

  resetForm() {
    this.formAbout = { mission: '', vision: '', story: '', valueText: '', imageUrl: '' };
    this.selectedImage = null;
  }
}
