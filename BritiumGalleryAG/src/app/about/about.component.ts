import { Component, OnInit, OnDestroy } from '@angular/core';
import { AboutService } from '../about.service';
import Swal from 'sweetalert2';
import { Editor, Toolbar } from 'ngx-editor';

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
export class AboutComponent implements OnInit, OnDestroy {

  aboutList: About[] = [];
  formAbout: About = { mission: '', vision: '', story: '', valueText: '', imageUrl: '' };
  editingAbout: About | null = null;
  selectedImage: File | null = null;

  // Editor instances for each field
  missionEditor!: Editor;
  visionEditor!: Editor;
  storyEditor!: Editor;
  valueTextEditor!: Editor;

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.loadAbouts();
    // Initialize editors
    this.missionEditor = new Editor();
    this.visionEditor = new Editor();
    this.storyEditor = new Editor();
    this.valueTextEditor = new Editor();
  }

  ngOnDestroy(): void {
    // Destroy editors
    this.missionEditor.destroy();
    this.visionEditor.destroy();
    this.storyEditor.destroy();
    this.valueTextEditor.destroy();
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

   if (this.editingAbout) {
  this.aboutService.update(this.editingAbout.id!, formData).subscribe(() => {
    Swal.fire({
      icon: 'success',
      title: 'Updated!',
      text: 'About section updated successfully.',
      timer: 2000,
      showConfirmButton: false
    });
    this.editingAbout = null;
    this.resetForm();
    this.loadAbouts();
  });
} else {
  this.aboutService.create(formData).subscribe(() => {
    Swal.fire({
      icon: 'success',
      title: 'Created!',
      text: 'New About section has been added.',
      timer: 2000,
      showConfirmButton: false
    });
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
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this about us post?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.aboutService.delete(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The About section has been deleted.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadAbouts();
        });
      }
    });
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
